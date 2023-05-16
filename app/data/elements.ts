import { hashGeometry } from "~/design/state/hashedGeometries"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { useCallback } from "react"
import { BufferGeometry, Mesh } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { proxy } from "valtio"
import { trpc } from "@/client/trpc"
import { Element } from "../../server/data/elements"
import { Module } from "../../server/data/modules"
import { O, R, RA, RR } from "~/utils/functions"
import { isMesh, useGLTF } from "~/utils/three"
import useSpeckleObject from "../utils/speckle/useSpeckleObject"

export const useElements = (): Element[] => {
  const { data = [] } = trpc.elements.useQuery()
  return data
}

export const useSystemElements = ({
  systemId,
}: {
  systemId: string
}): Element[] => {
  return useElements().filter((x) => x.systemId === systemId)
}

const useIfcTagToElement = (systemId: string) => {
  const elements = useSystemElements({ systemId })

  return useCallback(
    (ifcTag: string) => {
      const result = pipe(
        elements,
        RA.findFirst((el) => {
          return el.ifc4Variable.toUpperCase() === ifcTag
        }),
        O.toUndefined
      )

      if (result === undefined) {
        console.log({
          unmatchedNodeType: { ifcTag },
        })
      }

      return result
    },
    [elements]
  )
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
  speckleBranchUrl,
  dna,
}: Module): ElementGeometryHashMap => {
  const ifcTagToElement = useIfcTagToElement(systemId)
  const speckleObject = useSpeckleObject(speckleBranchUrl)
  const key = getModuleElementGeometriesKey({ systemId, dna })
  const maybeModuleElementGeometries = moduleElementGeometryHashMaps?.[key]
  if (maybeModuleElementGeometries) return maybeModuleElementGeometries

  return pipe(
    speckleObject,
    RA.reduce(
      {},
      (acc: { [e: string]: BufferGeometry[] }, { ifcTag, geometry }) => {
        const element = ifcTagToElement(ifcTag)
        if (!element) return acc

        return produce(acc, (draft) => {
          if (element.name in draft) draft[element.name].push(geometry)
          else draft[element.name] = [geometry]
          // node.traverse((child) => {
          //   if (isMesh(child)) {
          //   }
          // })
        })
      }
    ),
    RR.map((geoms) => mergeBufferGeometries(geoms)),
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
