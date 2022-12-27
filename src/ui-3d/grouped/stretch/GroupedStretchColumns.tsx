import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { Vector3 } from "three"
import { OBB } from "three-stdlib"
import { useSnapshot } from "valtio"
import { collideOBB, useHouseDimensions } from "@/hooks/dimensions"
import { HandleSide, HandleSideEnum } from "@/hooks/gestures/drag/handles"
import dragProxy from "@/hooks/gestures/drag/proxy"
import houses, { useHouse } from "@/hooks/houses"
import { useStretch } from "@/hooks/layouts"
import { EditModeEnum } from "@/hooks/siteCtx"
import { NEA, RA } from "@/utils/functions"
import { floor, max } from "@/utils/math"
import GroupedStretchColumn from "./GroupedStretchColumn"
import { useSubscribeKey } from "../../../utils/hooks"
import postTransients from "../../../hooks/transients/post"

const GroupedStretchColumns = ({ houseId }: { houseId: string }) => {
  const { startColumn, endColumn, vanillaColumn } = useStretch(houseId)

  const house = useHouse(houseId)

  const vanillaColumnLength = vanillaColumn[0].length

  const {
    length: houseLength,
    width: houseWidth,
    height: houseHeight,
  } = useHouseDimensions(houseId)

  const maxLength = 50

  const remainingLength = maxLength - houseLength

  const maxCount = floor(max(0, remainingLength) / vanillaColumnLength)

  const systemId = houses[houseId].systemId

  // switch sides here?

  useSubscribeKey(
    postTransients,
    houseId,
    () => {
      // const house = houses[houseId]
      // if (!house) return

      const { stretch } = postTransients[houseId]

      if (stretch) {
        const { dx, dz, side, distance } = stretch

        // switch (side) {
        //   case HandleSideEnum.Enum.FRONT:
        //     startRef.current.position.set(dx, 0, dz)
        //     break
        //   case HandleSideEnum.Enum.BACK:
        //     endRef.current.position.set(dx, 0, dz)
        //     break
        // }
      }

      // invalidate()
    },
    true
  )

  return null

  // const frontColumns =

  // return (
  //   <Fragment>
  //     {frontColumns}
  //     {backColumns}
  //   </Fragment>
  // )

  // return (
  //   <GroupedStretchColumn
  //     // key={side}
  //     {...{
  //       gridGroups: vanillaColumn,
  //       systemId,
  //       houseId,
  //       side: ,
  //     }}
  //   />
  // )

  // const endZ = house.position.z + houseLength - endColumn.length
  // const startZ = house.position.z + startColumn.length

  // const columnsUp = pipe(
  //   NEA.range(0, maxCount - 1),
  //   RA.map((i) => endZ + i * vanillaColumnLength),
  //   RA.takeLeftWhile((columnZ) => {
  //     const center = new Vector3(0, 0, columnZ + vanillaColumnLength / 2)
  //     const halfSize = new Vector3(
  //       houseWidth / 2,
  //       houseHeight / 2,
  //       vanillaColumnLength / 2
  //     )
  //     const obb = new OBB(center, halfSize)

  //     const collision = collideOBB(obb, [houseId])
  //     return !collision
  //   }),
  //   // columnZs => {
  //   //   const lastColumnZ = columnZs[columnZs.length - 1]
  //   //   return columnZs
  //   // },
  //   RA.map((columnZ) => (
  //     <StretchInstanceColumn
  //       key={columnZ}
  //       {...{
  //         gridGroups: vanillaColumn,
  //         systemId,
  //         houseId,
  //         columnZ,
  //         up: true,
  //       }}
  //     />
  //   ))
  // )
}

export default GroupedStretchColumns
