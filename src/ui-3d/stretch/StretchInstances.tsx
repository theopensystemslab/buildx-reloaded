import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { Vector3 } from "three"
import { OBB } from "three-stdlib"
import { useSnapshot } from "valtio"
import { collideOBB, useDimensions } from "../../hooks/dimensions"
import { HandleSide } from "../../hooks/gestures/drag/handles"
import dragProxy from "../../hooks/gestures/drag/proxy"
import houses, { useHouse } from "../../hooks/houses"
import { useStretch } from "../../hooks/layouts"
import { EditModeEnum } from "../../hooks/siteCtx"
import { NEA, RA } from "../../utils/functions"
import { floor, max } from "../../utils/math"
import StretchInstanceColumn from "./StretchInstanceColumn"

const StretchInstancesMain = ({
  houseId,
  side,
}: {
  houseId: string
  side: HandleSide
}) => {
  const { startColumn, endColumn, vanillaColumn } = useStretch(houseId)

  const house = useHouse(houseId)

  const vanillaColumnLength = vanillaColumn[0].length
  const {
    length: houseLength,
    width: houseWidth,
    height: houseHeight,
  } = useDimensions(houseId)

  const maxLength = 50

  const remainingLength = maxLength - houseLength

  const maxCount = floor(max(0, remainingLength) / vanillaColumnLength)

  const systemId = houses[houseId].systemId

  const endZ = house.position.z + houseLength - endColumn.length
  const startZ = house.position.z + startColumn.length

  const columnsUp = pipe(
    NEA.range(0, maxCount - 1),
    RA.map((i) => endZ + i * vanillaColumnLength),
    RA.takeLeftWhile((columnZ) => {
      const center = new Vector3(0, 0, columnZ + vanillaColumnLength / 2)
      const halfSize = new Vector3(
        houseWidth / 2,
        houseHeight / 2,
        vanillaColumnLength / 2
      )
      const obb = new OBB(center, halfSize)

      const collision = collideOBB(obb, [houseId])
      return !collision
    }),
    // columnZs => {
    //   const lastColumnZ = columnZs[columnZs.length - 1]
    //   return columnZs
    // },
    RA.map((columnZ) => (
      <StretchInstanceColumn
        key={columnZ}
        {...{
          gridGroups: vanillaColumn,
          systemId,
          houseId,
          columnZ,
          up: true,
        }}
      />
    ))
  )

  const columnsDown = pipe(
    NEA.range(0, maxCount - 1),
    RA.map((i) => startZ - i * vanillaColumnLength),
    RA.takeLeftWhile((columnZ) => {
      const center = new Vector3(0, 0, columnZ + vanillaColumnLength / 2)
      const halfSize = new Vector3(
        houseWidth / 2,
        houseHeight / 2,
        vanillaColumnLength / 2
      )
      const obb = new OBB(center, halfSize)

      const collision = collideOBB(obb, [houseId])
      return !collision
    }),
    RA.map((columnZ) => (
      <StretchInstanceColumn
        key={-columnZ}
        {...{
          gridGroups: vanillaColumn,
          systemId,
          houseId,
          columnZ,
          down: true,
        }}
      />
    ))
  )

  // return null

  return (
    <Fragment>
      {columnsUp}
      {columnsDown}
    </Fragment>
  )
}

const StretchInstances = () => {
  const { start } = useSnapshot(dragProxy)

  return start?.identifier.identifierType === "handle" &&
    start.identifier.editMode === EditModeEnum.Enum.STRETCH ? (
    <StretchInstancesMain
      houseId={start.identifier.houseId}
      side={start.identifier.side}
    />
  ) : null
}

export default StretchInstances
