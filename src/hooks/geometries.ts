import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { useEffect, useState } from "react"
import { BufferGeometry, Mesh } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { useSnapshot } from "valtio"
import { proxyMap } from "valtio/utils"
import { useSystemElements } from "../data/elements"
import { M, O, R, RA, RM, RNEA, RR, S } from "../utils/functions"
import { isMesh, useGLTF } from "../utils/three"
import { subscribeMapKey } from "../utils/valtio"
import houses, { useHouseModules } from "./houses"
import { ColumnLayout } from "./layouts"

type ElementName = string

type SystemIdModuleDna = string

type HouseId = string

export const moduleElementGeometries = proxyMap<
  SystemIdModuleDna,
  Map<
    ElementName, // element ifc tag or element code
    BufferGeometry
  >
>()

export const houseElementGeometries = proxyMap<
  HouseId,
  Map<
    ElementName, // element ifc tag or element code
    BufferGeometry
  >
>()

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

const useNodeTypeToElement = (systemId: string) => {
  const elements = useSystemElements({ systemId })
  return (nodeType: string) => {
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
  }
}

export const useHouseModuleElementGeometries = (houseId: string) => {
  const systemId = houses[houseId].systemId
  const modules = useHouseModules(houseId)

  const [dnas, glbUrls] = pipe(
    modules,
    RNEA.groupBy((x) => x.dna),
    RR.filterMap(
      RA.findFirstMap(
        (x): O.Option<string> => (x.glbUrl ? O.some(x.glbUrl) : O.none)
      )
    ),
    RR.toReadonlyArray,
    RA.unzip
  )

  const gltfs = useGLTF(glbUrls as string[])
  // TODO: ifcs = useIFC(ifcUrls)
  // prefer one or other
  // same outcome: upsert to moduleElementGeometries

  const nodeTypeToElement = useNodeTypeToElement(systemId)

  pipe(
    gltfs,
    RA.filterMapWithIndex((i, gltf) => {
      const exists = moduleElementGeometries.get(
        getModuleElementGeometriesKey({ systemId, dna: dnas[i] })
      )

      return exists
        ? O.none
        : O.some(
            pipe(
              gltf.nodes,
              R.toArray,
              RA.reduce(
                {},
                (acc: { [e: string]: Mesh[] }, [nodeType, node]) => {
                  const element = nodeTypeToElement(nodeType)
                  if (!element) return acc
                  return produce(acc, (draft) => {
                    node.traverse((child) => {
                      if (isMesh(child)) {
                        if (element.name in draft)
                          draft[element.name].push(child)
                        else draft[element.name] = [child]
                      }
                    })
                  })
                }
              ),
              RR.map((meshes) =>
                mergeBufferGeometries(meshes.map((mesh) => mesh.geometry))
              ),
              RR.filter((bg: BufferGeometry | null): bg is BufferGeometry =>
                Boolean(bg)
              ),
              (elementsGeometries) => {
                const elementMap = new Map<ElementName, BufferGeometry>()
                Object.entries(elementsGeometries).forEach(([k, v]) => {
                  elementMap.set(k, v)
                })

                moduleElementGeometries.set(
                  getModuleElementGeometriesKey({ systemId, dna: dnas[i] }),
                  elementMap
                )
              }
            )
          )
    })
    // () => moduleElementGeometries
  )
}

// I think you don't want this because it can't instance beyond the house
// export const useHouseElementGeometries = (houseId: string, columnLayout: ColumnLayout) => {
//   const houseModuleElementGeometries = useHouseModuleElementGeometries(houseId)
//   pipe(
//     houseModuleElementGeometries,
//     RM.collect(S.Ord)((k, moduleGeometries) => pipe(moduleGeometries, RM.))
//   )
// }

export const useModuleElementGeometries = (systemId: string, dna: string) => {
  const moduleElementGeometriesMap = useSnapshot(moduleElementGeometries)
  const key = getModuleElementGeometriesKey({ systemId, dna })
  return moduleElementGeometriesMap.get(key)

  // useEffect(
  //   () =>
  //     subscribeMapKey(moduleElementGeometries, key, () => {
  //       const elementMap = moduleElementGeometries.get(key)
  //       if (!elementMap) throw new Error("no element map")

  //       elementMap.get
  //     }),
  //   [key, dna, systemId]
  // )
}

// export const useHouseModuleElementGeometries = (houseId: string) => {
//   const [foo, setFoo] = useState<any>()
// }
