import {
  collideOBB,
  useHouseDimensions,
  useHouseMatrix,
  useRenderOBB,
} from "@/hooks/dimensions"
import { HandleSideEnum } from "@/hooks/gestures/drag/handles"
import houses from "@/hooks/houses"
import { useStretchColumns } from "@/hooks/layouts"
import { NEA, RA } from "@/utils/functions"
import { floor, max } from "@/utils/math"
import { useThree } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useMemo } from "react"
import { BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, Vector3 } from "three"
import { OBB } from "three-stdlib"
import GroupedStretchColumn from "./GroupedStretchColumn"

const GroupedStretchColumns = ({ houseId }: { houseId: string }) => {
  const { startColumn, endColumn, vanillaColumn } = useStretchColumns(houseId)

  const vanillaColumnLength = vanillaColumn[0].length
  const {
    length: houseLength,
    width: houseWidth,
    height: houseHeight,
  } = useHouseDimensions(houseId)

  const maxLength = 25
  const maxCount = floor(max(0, maxLength - houseLength) / vanillaColumnLength)

  const systemId = houses[houseId].systemId

  const columnZs = pipe(
    NEA.range(0, maxCount - 1),
    RA.map((i) => i * vanillaColumnLength)
  )

  const computeMatrix = useHouseMatrix(houseId)

  const renderOBB = useRenderOBB()

  const columnsUp = useMemo(
    () =>
      pipe(
        columnZs,
        RA.takeLeftWhile((columnZ) => {
          const center = new Vector3(0, 0, 0)

          const halfSize = new Vector3(
            houseWidth / 2,
            houseHeight / 2,
            vanillaColumnLength / 2
          )

          const obb = new OBB(center, halfSize)

          const houseMatrix = computeMatrix({
            y: houseHeight / 2,
            z: houseLength / 2 + columnZ,
          })

          obb.applyMatrix4(houseMatrix)

          // renderOBB(obb, houseMatrix)

          const collision = collideOBB(obb, [houseId])

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
      ),
    [
      columnZs,
      computeMatrix,
      houseHeight,
      houseId,
      houseLength,
      houseWidth,
      systemId,
      vanillaColumn,
      vanillaColumnLength,
    ]
  )

  const columnsDown = pipe(
    columnZs,
    RA.map((x) => -1 * x),
    RA.takeLeftWhile((columnZ) => {
      const center = new Vector3(0, 0, 0)

      const halfSize = new Vector3(
        houseWidth / 2,
        houseHeight / 2,
        vanillaColumnLength / 2
      )

      const obb = new OBB(center, halfSize)

      const houseMatrix = computeMatrix({
        y: houseHeight / 2,
        z: -(houseLength / 2) + columnZ,
      })

      obb.applyMatrix4(houseMatrix)

      // renderOBB(obb, houseMatrix)

      const collision = collideOBB(obb, [houseId])

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
