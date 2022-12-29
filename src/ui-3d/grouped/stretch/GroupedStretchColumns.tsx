import { collideOBB, useHouseDimensions } from "@/hooks/dimensions"
import { HandleSideEnum } from "@/hooks/gestures/drag/handles"
import houses from "@/hooks/houses"
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
  console.log({ houseLength })
  return (
    <Fragment>
      <group position={[0, 0, houseLength - endColumn.length]}>
        {columnsUp}
      </group>
      <group position={[0, 0, startColumn.length]}>{columnsDown}</group>
    </Fragment>
  )
}

export default GroupedStretchColumns
