import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { BufferGeometry, Mesh } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { proxyMap } from "valtio/utils"
import { M, O, R, RA, RM, RNEA, RR, S } from "../utils/functions"
import { isMesh, useGLTF } from "../utils/three"
import { useSystemElements } from "./elements"
import houses, { useHouseModules } from "./houses"

type ElementName = string

type SystemIdModuleDna = string

export const moduleElementGeometries = proxyMap<
  SystemIdModuleDna,
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

export const useHouseGeometries = (houseId: string) => {
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

  const nodeTypeToElement = useNodeTypeToElement(systemId)

  pipe(
    gltfs,
    RA.mapWithIndex((i, gltf) =>
      pipe(
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
    // module element geoms to house element geoms
  )
}

// export const useModuleElementGeometries = (
//   systemId: string,
//   moduleDna: string
//   // gltf: GltfT
// ) => {
//   const elements = useSystemElements({ systemId })
//   // const { elements: systemElements } = useSystemsData()
//   // const elements = systemElements.filter((el) => el.systemId === systemId)

//   const maybeModuleGeometries = moduleElementGeometries.get(moduleDna)
//   if (maybeModuleGeometries) return maybeModuleGeometries

//   const elementMap = new Map<ElementName, BufferGeometry>()

//   const getElement = (nodeType: string) => {
//     const strippedNodeType = nodeType
//       .replace(/I?None.*/, "")
//       .replace(/Component.*/, "")
//       .replace(/Union.*/, "")
//       .replaceAll(/[0-9]/g, "")
//       .replace(/Object/, "")
//       .replace(/(Ifc.*)(Ifc.*)/, "$1")
//     const result = pipe(
//       elements,
//       RA.findFirst((el) => {
//         return el.ifc4Variable === strippedNodeType
//       }),
//       O.toUndefined
//     )

//     if (result === undefined && nodeType.startsWith("Ifc")) {
//       console.log({
//         unmatchedNodeType: { nodeType, strippedNodeType, moduleDna },
//       })
//     }

//     return result
//   }

//   // const elementMeshes = pipe(
//   //   gltf.nodes,
//   //   toArray,
//   //   reduceA({}, (acc: { [e: string]: Mesh[] }, [nodeType, node]) => {
//   //     const element = getElement(nodeType)
//   //     if (!element) return acc
//   //     return produce(acc, (draft) => {
//   //       node.traverse((child) => {
//   //         if (isMesh(child)) {
//   //           if (element.name in draft) draft[element.name].push(child)
//   //           else draft[element.name] = [child]
//   //         }
//   //       })
//   //     })
//   //   }),
//   //   mapR((meshes) =>
//   //     mergeBufferGeometries(meshes.map((mesh) => mesh.geometry))
//   //   ),
//   //   filterR((bg: BufferGeometry | null): bg is BufferGeometry => Boolean(bg))
//   // )

//   // Object.entries(elementMeshes).forEach(([k, v]) => {
//   //   elementMap.set(k, v)
//   // })

//   // geometries.set(`${systemId}:${moduleDna}`, elementMap)

//   return elementMap
// }

// export default geometries
