import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import { Vector3 } from "three"
import { OBB } from "three-stdlib"
import { proxy } from "valtio"
import GroupedStretchColumn from "../../ui-3d/grouped/stretch/GroupedStretchColumn"
import { A, NEA, RA } from "../../utils/functions"
import { floor, max } from "../../utils/math"
import {
  collideOBB,
  useHouseDimensionsUpdates,
  useHouseMatrix,
} from "../dimensions"
import { HandleSide, HandleSideEnum } from "../gestures/drag/handles"
import houses, { useHouse } from "../houses"
import { ColumnLayout, PositionedRow } from "../layouts"
import {
  getVanillaColumnLength,
  useGetVanillaModule,
  vanillaColumns,
} from "../vanilla"

export type Stretch = {
  side: HandleSide
  dx: number
  dz: number
  distance: number
}

export const stretchLength = proxy<Record<string, Stretch>>({})

export const splitColumns = (layout: ColumnLayout) =>
  pipe(
    layout,
    RA.partition(
      ({ columnIndex }) =>
        columnIndex === 0 || columnIndex === layout.length - 1
    ),
    ({ left: midColumns, right: [startColumn, endColumn] }) => ({
      startColumn,
      endColumn,
      midColumns,
    })
  )

export const useStretchLength = (houseId: string, layout: ColumnLayout) => {
  const systemId = houses[houseId].systemId

  const { startColumn, endColumn, midColumns } = splitColumns(layout)

  const getVanillaModule = useGetVanillaModule(houses[houseId].systemId)

  const { position, rotation } = useHouse(houseId)

  const vanillaColumn = pipe(
    startColumn.gridGroups,
    A.map(
      ({ levelIndex, levelType, y, modules: [{ module }] }): PositionedRow => {
        const vanillaModule = getVanillaModule(module, {
          constrainGridType: false,
          positionType: "MID",
        })
        return {
          modules: [
            {
              module: vanillaModule,
              gridGroupIndex: 0,
              z: 0,
            },
          ],
          length: vanillaModule.length,
          y,
          levelIndex,
          levelType,
        }
      }
    )
  )

  vanillaColumns[houseId] = vanillaColumn

  const vanillaColumnLength = getVanillaColumnLength(vanillaColumn)

  const {
    length: houseLength,
    width: houseWidth,
    height: houseHeight,
  } = useHouseDimensionsUpdates(houseId)

  const computeMatrix = useHouseMatrix(houseId)

  const maxLength = 25
  const maxCount = floor(max(0, maxLength - houseLength) / vanillaColumnLength)
  const maxColumnZs = pipe(
    NEA.range(0, maxCount - 1),
    RA.map((i) => i * vanillaColumnLength)
  )

  const columnZsUp = useMemo(
    () =>
      pipe(
        maxColumnZs,
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

          const collision = collideOBB(obb, [houseId])

          return !collision
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      computeMatrix,
      houseHeight,
      houseId,
      houseLength,
      houseWidth,
      maxColumnZs,
      vanillaColumnLength,
      position,
      rotation,
    ]
  )
  const maxStretchUp = columnZsUp?.[columnZsUp.length - 1] ?? 0

  const columnZsDown = useMemo(
    () =>
      pipe(
        maxColumnZs,
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
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      computeMatrix,
      houseHeight,
      houseId,
      houseLength,
      houseWidth,
      maxColumnZs,
      vanillaColumnLength,
      position,
      rotation,
    ]
  )
  const maxStretchDown = columnZsDown?.[columnZsDown.length - 1] ?? 0

  const columnsUp = pipe(
    columnZsUp,
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
    )),
    (columns) => (
      <group position={[0, 0, houseLength - endColumn.length]}>{columns}</group>
    )
  )

  const columnsDown = pipe(
    columnZsDown,
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
    )),
    (columns) => <group position={[0, 0, startColumn.length]}>{columns}</group>
  )
  return {
    startColumn,
    endColumn,
    vanillaColumn,
    midColumns,
    columnsUp,
    columnsDown,
    maxStretchDown,
    maxStretchUp,
  }
}
