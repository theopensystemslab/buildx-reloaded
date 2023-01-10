import { systemFromId } from "@/data/system"
import { hashGeometry } from "@/hooks/hashedGeometries"
import Airtable from "airtable"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { useCallback } from "react"
import { BufferGeometry, Mesh } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { proxy, useSnapshot } from "valtio"
import * as z from "zod"
import { O, R, RA, RR } from "../utils/functions"
import { isMesh, useGLTF } from "../utils/three"
import { trpc } from "../utils/trpc"
import { materialsQuery } from "./materials"
import { Module } from "./modules"

export type Element = {
  id: string
  systemId: string
  name: string
  ifc4Variable: string
  defaultMaterial: string
  materialOptions: Array<string>
  category: string
}

export const elementParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    element_code: z
      .string()
      .min(1)
      .transform((s) => s.trim()),
    ifc4_variable: z.string().min(1),
    default_material: z.array(z.string().min(1)).optional(),
    element_category: z.string().min(1),
  }),
})

export const elementsQuery =
  (airtable: Airtable) =>
  async ({
    input: { systemId },
  }: {
    input: { systemId: string }
  }): Promise<Element[]> => {
    const materials = await materialsQuery(airtable)({ input: { systemId } })

    return pipe(
      airtable
        .base(systemFromId(systemId)?.airtableId ?? "")
        .table("building_elements")
        .select()
        .all()
        .then(
          z.array(
            elementParser.transform(
              ({
                id,
                fields: { element_code, ifc4_variable, element_category },
              }) => {
                const defaultMaterials = materials.filter(({ defaultFor }) =>
                  defaultFor.includes(id)
                )
                const optionalMaterials = materials.filter(({ optionalFor }) =>
                  optionalFor.includes(id)
                )
                const defaultMaterial =
                  defaultMaterials[0]?.name || optionalMaterials[0]?.name || ""
                const materialOptions = optionalMaterials.map(
                  (material) => material.name
                )
                return {
                  id,
                  systemId,
                  name: element_code,
                  ifc4Variable: ifc4_variable,
                  defaultMaterial,
                  materialOptions,
                  category: element_category,
                }
              }
            )
          ).parse
        )
    )
  }

const systemElements = proxy<Record<string, Element[]>>({})

export const useSystemElements = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(systemElements) as typeof systemElements
  return snap?.[systemId] ?? []
}

export const useInitSystemElements = ({ systemId }: { systemId: string }) => {
  trpc.systemElements.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        systemElements[systemId] = data
      },
    }
  )
  return useSystemElements({ systemId })
}

const useNodeTypeToElement = (systemId: string) => {
  const elements = useSystemElements({ systemId })

  return useCallback(
    (nodeType: string) => {
      const strippedNodeType = nodeType
        .replace(/I?None.*/, "")
        .replace(/Component.*/, "")
        .replace(/Union.*/, "")
        .replaceAll(/[0-9]/g, "")
        .replace(/Object/, "")
        .replace(/(Ifc.*)(Ifc.*)/, "$1")
      const result = pipe(
        elements,
        RA.findFirst((el) => {
          return el.ifc4Variable === strippedNodeType
        }),
        O.toUndefined
      )

      if (result === undefined && nodeType.startsWith("Ifc")) {
        console.log({
          unmatchedNodeType: { nodeType, strippedNodeType },
        })
      }

      return result
    },
    [elements]
  )
}

type ElementName = string
type SystemIdModuleDna = string
type GeometryHash = string

type ElementGeometryHashMap = Map<
  ElementName, // element ifc tag or element code
  GeometryHash
>

export const moduleElementGeometryHashMaps =
  proxy<Record<SystemIdModuleDna, ElementGeometryHashMap>>()

export const getModuleElementGeometriesKey = ({
  systemId,
  dna,
}: {
  systemId: string
  dna: string
}) => `${systemId}:${dna}`

export const invertModuleElementGeometriesKey = (input: string) => {
  const [systemId, dna] = input.split(":")
  return { systemId, dna }
}

export const useModuleElements = ({
  systemId,
  glbUrl,
  dna,
}: Module): ElementGeometryHashMap => {
  const nodeTypeToElement = useNodeTypeToElement(systemId)
  const gltf = useGLTF(glbUrl)
  const key = getModuleElementGeometriesKey({ systemId, dna })
  const maybeModuleElementGeometries = moduleElementGeometryHashMaps?.[key]
  if (maybeModuleElementGeometries) return maybeModuleElementGeometries

  return pipe(
    gltf.nodes,
    R.toArray,
    RA.reduce({}, (acc: { [e: string]: Mesh[] }, [nodeType, node]) => {
      const element = nodeTypeToElement(nodeType)
      if (!element) return acc
      return produce(acc, (draft) => {
        node.traverse((child) => {
          if (isMesh(child)) {
            if (element.name in draft) draft[element.name].push(child)
            else draft[element.name] = [child]
          }
        })
      })
    }),
    RR.map((meshes) =>
      mergeBufferGeometries(meshes.map((mesh) => mesh.geometry))
    ),
    RR.filter((bg: BufferGeometry | null): bg is BufferGeometry => Boolean(bg)),
    (elementGeometries) => {
      const elements = new Map<ElementName, GeometryHash>()
      Object.entries(elementGeometries).forEach(([k, geom]) => {
        const hash = hashGeometry(geom)
        elements.set(k, hash)
      })

      moduleElementGeometryHashMaps[key] = elements

      return elements
    }
  )
}

export default systemElements
