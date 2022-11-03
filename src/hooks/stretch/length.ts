import { flow, identity, pipe } from "fp-ts/lib/function"
import { BufferGeometry, Mesh } from "three"
import { proxy } from "valtio"
import { Module, useGetVanillaModule } from "../../data/modules"
import { errorThrower, O, RA, RR } from "../../utils/functions"
import houses from "../houses"
import { PositionedColumn, PositionedModule, PositionedRow } from "../layouts"

export const stretch = proxy({
  endVanillaColumns: 0,
  startVanillaColumns: 0,
  visibleStartIndex: -1,
  visibleEndIndex: -1,
  stretching: false,
})

export type VanillaPositionedRow = PositionedRow & {
  geometry: BufferGeometry
}

// const t: PositionedRow = {
//   length,
//   levelIndex,
//   levelType,
//   modules,
//   y,
// }

// const getColumnLength = (column: PositionedColumn) =>
//   column.gridGroups[0].modules.reduce((acc, v) => acc + v.module.length, 0)

// const getColumnsLength = flow(
//   RA.reduce(0, (acc, v: PositionedColumn) => acc + getColumnLength(v))
// )

// export const useVanillaPositionedRows = (
//   systemId: string,
//   gridGroups: readonly PositionedRow[]
// ) => {
//   const getVanillaModule = useGetVanillaModule(systemId)
//   return pipe(
//     gridGroups,
//     RA.map(
//       ({ levelIndex, levelType, y, modules: modulesIn }: PositionedRow) => {
//         const modules = pipe(
//           modulesIn,
//           RA.reduceWithIndex(
//             [],
//             (
//               i,
//               positionedModules: PositionedModule[],
//               { module: moduleIn }: PositionedModule
//             ) => {
//               const isFirst: boolean = i === 0

//               const vanillaModuleOut = pipe(
//                 getVanillaModule(moduleIn, {
//                   positionType: "MID",
//                   constrainGridType: false,
//                 })
//               )

//               const z = isFirst
//                 ? vanillaModuleOut.length / 2
//                 : positionedModules[i - 1].z +
//                   positionedModules[i - 1].module.length / 2 +
//                   vanillaModuleOut.length / 2

//               return [
//                 ...positionedModules,
//                 {
//                   module: vanillaModuleOut,
//                   z,
//                 },
//               ] as any
//             }
//           )
//         )
//         return {
//           levelIndex,
//           levelType,
//           y,
//           modules,
//           length: modules.reduce((acc, v) => acc + v.module.length, 0),
//         }
//       }
//     ),
//     RA.map(
//       ({
//         modules,
//         levelIndex,
//         levelType,
//         y,
//         length,
//       }): VanillaPositionedRow => ({
//         levelIndex,
//         levelType,
//         y,
//         length,
//         modules,
//         geometry: pipe(
//           modules,
//           RA.chain((module) => RR.toReadonlyArray(module.module.gltf.nodes)),
//           RA.reduce([], (rowMeshes: Mesh[], [, node]) => {
//             return produce(rowMeshes, (draft) => {
//               node.traverse((child) => {
//                 if (isMesh(child)) {
//                   draft.push(child)
//                 }
//               })
//             })
//           }),
//           (meshes) => {
//             const geom = mergeBufferGeometries(
//               meshes.map((mesh) => mesh.geometry)
//             )
//             if (!geom) throw new Error()
//             return geom
//           }
//         ),
//       })
//     )
//   )
// }

// export const useStretchLength = (
//   houseId: string,
//   columnLayout: ColumnLayout
// ) => {
//   const house = useHouse(houseId)

//   const systemId = houses[houseId].systemId

//   const rotateVector = useRotateVector(houseId)

//   const { startColumn, endColumn, midColumns } = pipe(
//     columnLayout,
//     partition(
//       ({ columnIndex }) =>
//         columnIndex === 0 || columnIndex === columnLayout.length - 1
//     ),
//     ({ left: midColumns, right: [startColumn, endColumn] }) => ({
//       startColumn,
//       endColumn,
//       midColumns,
//     })
//   )

//   if (stretch.visibleStartIndex === -1 && stretch.visibleEndIndex === -1) {
//     stretch.visibleStartIndex = startColumn.columnIndex
//     stretch.visibleEndIndex = endColumn.columnIndex
//   }

//   const vanillaPositionedRows = useVanillaPositionedRows(
//     systemId,
//     startColumn.gridGroups
//   )

//   const vanillaColumnLength = vanillaPositionedRows[0].length

//   const totalLength = getColumnsLength(columnLayout)

//   const midRiffLength = getColumnsLength(midColumns)

//   const {
//     length: { max: maxLength },
//   } = useSystemSettings(house.systemId)

//   const startClamp = clamp(
//     -(maxLength - totalLength),
//     midRiffLength - vanillaColumnLength
//   )

//   const endClamp = clamp(
//     -midRiffLength + vanillaColumnLength,
//     maxLength - totalLength
//   )

//   const columnZsUp = columnLayout.map((x) => x.z)
//   const columnZsDown = columnLayout
//     .map(({ z, columnIndex }) => ({ target: totalLength - z, columnIndex }))
//     .reverse()

//   const sendDrag = (
//     z: number,
//     { isStart, first }: { isStart: boolean; first: boolean } = {
//       isStart: true,
//       first: false,
//     }
//   ) => {
//     if (first) stretch.stretching = true
//     if (isStart) {
//       if (z < 0) {
//         const nextVanillaLength = Math.ceil(-z / vanillaColumnLength)
//         if (nextVanillaLength !== stretch.startVanillaColumns) {
//           stretch.startVanillaColumns = nextVanillaLength
//         }
//       } else if (z > 0) {
//         stretch.startVanillaColumns = 0
//         const visibleStartIndex = columnZsUp.findIndex((columnZ) => columnZ > z)
//         if (stretch.visibleStartIndex !== visibleStartIndex) {
//           stretch.visibleStartIndex = visibleStartIndex
//         }
//       }
//     } else if (!isStart) {
//       if (z > 0) {
//         const nextVanillaLength = Math.ceil(z / vanillaColumnLength)
//         if (nextVanillaLength !== stretch.startVanillaColumns) {
//           stretch.endVanillaColumns = nextVanillaLength
//         }
//       } else if (z < 0) {
//         stretch.endVanillaColumns = 0
//         const result = columnZsDown.find((x) => -z < x.target)
//         if (result) {
//           stretch.visibleEndIndex = result.columnIndex - 1
//         }
//       }
//     }
//   }

//   const sendDrop = () => {
//     const {
//       startVanillaColumns,
//       endVanillaColumns,
//       visibleStartIndex,
//       visibleEndIndex,
//     } = stretch

//     if (startVanillaColumns > 0 || endVanillaColumns > 0) {
//       houses[house.id].dna = columnLayoutToDNA([
//         startColumn,
//         ...replicate(startVanillaColumns, {
//           gridGroups: vanillaPositionedRows,
//         }),
//         ...midColumns,
//         ...replicate(endVanillaColumns, {
//           gridGroups: vanillaPositionedRows,
//         }),
//         endColumn,
//       ]) as string[]

//       if (startVanillaColumns > 0) {
//         const dz = startVanillaColumns * vanillaColumnLength
//         const [dx1, dz1] = rotateVector([0, dz])
//         houses[houseId].position[0] += dx1
//         houses[houseId].position[1] -= dz1
//       }
//     } else if (
//       visibleStartIndex > 0 ||
//       visibleEndIndex < columnLayout.length - 1
//     ) {
//       houses[house.id].dna = columnLayoutToDNA([
//         startColumn,
//         ...midColumns.slice(visibleStartIndex, visibleEndIndex),
//         endColumn,
//       ]) as string[]

//       if (visibleStartIndex > 0) {
//         const dz = visibleStartIndex * vanillaColumnLength
//         const [dx1, dz1] = rotateVector([0, dz])
//         houses[houseId].position[0] -= dx1
//         houses[houseId].position[1] += dz1
//       }
//     }

//     // reset
//     stretch.visibleStartIndex = -1
//     stretch.visibleEndIndex = -1
//     stretch.endVanillaColumns = 0
//     stretch.startVanillaColumns = 0
//     stretch.stretching = false
//   }

//   return {
//     startColumn,
//     endColumn,
//     midColumns,
//     columnLayout,
//     startClamp,
//     endClamp,
//     sendDrag,
//     sendDrop,
//     vanillaPositionedRows,
//   }
// }
