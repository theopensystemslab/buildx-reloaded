import { collideOBB, useHouseDimensions } from "@/hooks/dimensions"
import { HandleSideEnum } from "@/hooks/gestures/drag/handles"
import houses, { useHouse } from "@/hooks/houses"
import { useStretch } from "@/hooks/layouts"
import { NEA, RA } from "@/utils/functions"
import { floor, max } from "@/utils/math"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { Vector3 } from "three"
import { OBB } from "three-stdlib"
import GroupedStretchColumn from "./GroupedStretchColumn"

const GroupedStretchColumns = ({ houseId }: { houseId: string }) => {
  const { startColumn, endColumn, vanillaColumn } = useStretch(houseId)

  const vanillaColumnLength = vanillaColumn[0].length
  const {
    length: houseLength,
    width: houseWidth,
    height: houseHeight,
  } = useHouseDimensions(houseId)

  const maxLength = 10
  const maxCount = floor(max(0, maxLength - houseLength) / vanillaColumnLength)

  const systemId = houses[houseId].systemId

  const columnZs = pipe(
    NEA.range(0, maxCount - 1),
    RA.map((i) => i * vanillaColumnLength)
  )

  const columnsUp = pipe(
    columnZs,
    RA.takeLeftWhile((columnZ) => {
      return true
      // TODO: +/- here?
      const center = new Vector3(0, 0, columnZ + vanillaColumnLength / 2)
      const halfSize = new Vector3(
        houseWidth / 2,
        houseHeight / 2,
        vanillaColumnLength / 2
      )
      const obb = new OBB(center, halfSize)

      const collision = collideOBB(obb, [houseId])
      console.log(collision)
      return !collision
    }),
    RA.map((columnZ) => (
      <group key={columnZ} position={[0, 0, columnZ]}>
        <GroupedStretchColumn
          key={columnZ}
          {...{
            gridGroups: vanillaColumn,
            systemId,
            houseId,
            side: HandleSideEnum.Enum.BACK,
            columnZ,
            columnLength: vanillaColumnLength,
          }}
        />
      </group>
    ))
  )

  const columnsDown = pipe(
    columnZs,
    RA.map((x) => -1 * x),
    RA.takeLeftWhile((columnZ) => {
      return true
      // TODO: +/- here?
      const center = new Vector3(0, 0, columnZ + vanillaColumnLength / 2)
      const halfSize = new Vector3(
        houseWidth / 2,
        houseHeight / 2,
        vanillaColumnLength / 2
      )
      const obb = new OBB(center, halfSize)

      const collision = collideOBB(obb, [houseId])
      console.log(collision)
      return !collision
    }),
    RA.map((columnZ) => (
      <group key={columnZ} position={[0, 0, columnZ]}>
        <GroupedStretchColumn
          key={columnZ}
          {...{
            gridGroups: vanillaColumn,
            systemId,
            houseId,
            side: HandleSideEnum.Enum.FRONT,
            columnZ,
            columnLength: vanillaColumnLength,
          }}
        />
      </group>
    ))
  )
  // const columnsUp = pipe(
  //   NEA.range(0, maxCount - 1),
  //   RA.map((i) => i * vanillaColumnLength),
  //   RA.takeLeftWhile((columnZ) => {
  //     const center = new Vector3(0, 0, columnZ + vanillaColumnLength / 2)
  //     const halfSize = new Vector3(
  //       houseWidth / 2,
  //       houseHeight / 2,
  //       vanillaColumnLength / 2
  //     )
  //     const obb = new OBB(center, halfSize)

  //     const collision = collideOBB(obb, [houseId])
  //     console.log(collision)
  //     return !collision
  //   }),
  //   RA.map((columnZ) => (
  //     <group key={columnZ} position={[0, 0, columnZ]}>
  //       <GroupedStretchColumn
  //         key={columnZ}
  //         {...{
  //           gridGroups: vanillaColumn,
  //           systemId,
  //           houseId,
  //           columnZ,
  //           side: HandleSideEnum.Enum.BACK,
  //         }}
  //       />
  //     </group>
  //   ))
  // )

  // const columnsDown = pipe(
  //   NEA.range(0, maxCount - 1),
  //   RA.map((i) => startZ - i * vanillaColumnLength),
  //   RA.takeLeftWhile((columnZ) => {
  //     const center = new Vector3(0, 0, columnZ + vanillaColumnLength / 2)
  //     const halfSize = new Vector3(
  //       houseWidth / 2,
  //       houseHeight / 2,
  //       vanillaColumnLength / 2
  //     )
  //     const obb = new OBB(center, halfSize)

  //     const collision = collideOBB(obb, [houseId])
  //     console.log(collision)
  //     return !collision
  //   }),
  //   RA.map((columnZ) => (
  //     <group key={-columnZ} position={[0, 0, -columnZ]}>
  //       <GroupedStretchColumn
  //         {...{
  //           gridGroups: vanillaColumn,
  //           systemId,
  //           houseId,
  //         }}
  //       />
  //     </group>
  //   ))
  // )

  return (
    <Fragment>
      <group position={[0, 0, houseLength - endColumn.length]}>
        {columnsUp}
      </group>
      <group position={[0, 0, startColumn.length]}>{columnsDown}</group>
    </Fragment>
  )
}

// const GroupedStretchColumns = ({ houseId }: { houseId: string }) => {
//   const { startColumn, endColumn, vanillaColumn } = useStretch(houseId)

//   const house = useHouse(houseId)

//   const vanillaColumnLength = vanillaColumn[0].length

//   const {
//     length: houseLength,
//     width: houseWidth,
//     height: houseHeight,
//   } = useHouseDimensions(houseId)

//   const maxLength = 50

//   const remainingLength = maxLength - houseLength

//   const maxCount = floor(max(0, remainingLength) / vanillaColumnLength)

//   const systemId = houses[houseId].systemId

//   // switch sides here?

//   useSubscribeKey(
//     postTransients,
//     houseId,
//     () => {
//       // const house = houses[houseId]
//       // if (!house) return

//       const { stretch } = postTransients[houseId]

//       if (stretch) {
//         const { dx, dz, side, distance } = stretch

//         // switch (side) {
//         //   case HandleSideEnum.Enum.FRONT:
//         //     startRef.current.position.set(dx, 0, dz)
//         //     break
//         //   case HandleSideEnum.Enum.BACK:
//         //     endRef.current.position.set(dx, 0, dz)
//         //     break
//         // }
//       }

//       // invalidate()
//     },
//     true
//   )
//   const columnsUp = pipe(
//     NEA.range(0, maxCount - 1),
//     RA.map((i) => endZ + i * vanillaColumnLength),
//     RA.takeLeftWhile((columnZ) => {
//       const center = new Vector3(0, 0, columnZ + vanillaColumnLength / 2)
//       const halfSize = new Vector3(
//         houseWidth / 2,
//         houseHeight / 2,
//         vanillaColumnLength / 2
//       )
//       const obb = new OBB(center, halfSize)

//       const collision = collideOBB(obb, [houseId])
//       console.log(collision)
//       return !collision
//     }),
//     RA.map((columnZ) => (
//       <StretchInstanceColumn
//         key={columnZ}
//         {...{
//           gridGroups: vanillaColumn,
//           systemId,
//           houseId,
//           columnZ,
//         }}
//       />
//     ))
//   )

//   const columnsDown = pipe(
//     NEA.range(0, maxCount - 1),
//     RA.map((i) => startZ - i * vanillaColumnLength),
//     RA.takeLeftWhile((columnZ) => {
//       const center = new Vector3(0, 0, columnZ + vanillaColumnLength / 2)
//       const halfSize = new Vector3(
//         houseWidth / 2,
//         houseHeight / 2,
//         vanillaColumnLength / 2
//       )
//       const obb = new OBB(center, halfSize)

//       const collision = collideOBB(obb, [houseId])
//       console.log(collision)
//       return !collision
//     }),
//     RA.map((columnZ) => (
//       <StretchInstanceColumn
//         key={-columnZ}
//         {...{
//           gridGroups: vanillaColumn,
//           systemId,
//           houseId,
//           columnZ,
//         }}
//       />
//     ))
//   )

//   return (
//     <Fragment>
//       {columnsUp}
//       {columnsDown}
//     </Fragment>
//   )

//   return null

//   // const frontColumns =

//   // return (
//   //   <Fragment>
//   //     {frontColumns}
//   //     {backColumns}
//   //   </Fragment>
//   // )

//   // return (
//   //   <GroupedStretchColumn
//   //     // key={side}
//   //     {...{
//   //       gridGroups: vanillaColumn,
//   //       systemId,
//   //       houseId,
//   //       side: ,
//   //     }}
//   //   />
//   // )

//   // const endZ = house.position.z + houseLength - endColumn.length
//   // const startZ = house.position.z + startColumn.length

//   // const columnsUp = pipe(
//   //   NEA.range(0, maxCount - 1),
//   //   RA.map((i) => endZ + i * vanillaColumnLength),
//   //   RA.takeLeftWhile((columnZ) => {
//   //     const center = new Vector3(0, 0, columnZ + vanillaColumnLength / 2)
//   //     const halfSize = new Vector3(
//   //       houseWidth / 2,
//   //       houseHeight / 2,
//   //       vanillaColumnLength / 2
//   //     )
//   //     const obb = new OBB(center, halfSize)

//   //     const collision = collideOBB(obb, [houseId])
//   //     return !collision
//   //   }),
//   //   // columnZs => {
//   //   //   const lastColumnZ = columnZs[columnZs.length - 1]
//   //   //   return columnZs
//   //   // },
//   //   RA.map((columnZ) => (
//   //     <StretchInstanceColumn
//   //       key={columnZ}
//   //       {...{
//   //         gridGroups: vanillaColumn,
//   //         systemId,
//   //         houseId,
//   //         columnZ,
//   //         up: true,
//   //       }}
//   //     />
//   //   ))
//   // )
// }

export default GroupedStretchColumns
