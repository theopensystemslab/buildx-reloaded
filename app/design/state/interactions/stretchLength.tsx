import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import { suspend } from "suspend-react"
import { Matrix4, Vector3 } from "three"
import { OBB } from "three-stdlib"
import layoutsDB, { LayoutKey, serializeLayoutKey } from "../../../db/layouts"
import { A, NEA } from "../../../utils/functions"
import { floor, max } from "../../../utils/math"
import { getLayoutsWorker } from "../../../workers"
import { PositionedColumn } from "../../../workers/layouts"
import GroupedStretchColumn from "../../ui-3d/grouped/stretchLength/GroupedStretchColumn"
import { collideOBB } from "../dimensions"
import { vanillaColumns } from "../vanilla"

export const useStretchLength2 = ({
  houseId,
  layoutKey,
  reactHouseMatrix,
  width,
  height,
  length,
  startColumn,
  endColumn,
}: {
  houseId: string
  layoutKey: LayoutKey
  reactHouseMatrix: Matrix4
  width: number
  height: number
  length: number
  startColumn: PositionedColumn
  endColumn: PositionedColumn
}) => {
  const { systemId } = layoutKey
  const strLayoutKey = serializeLayoutKey(layoutKey)

  const vanillaColumn = suspend(async () => {
    if (strLayoutKey in vanillaColumns) {
      return vanillaColumns[strLayoutKey]
    } else {
      const layoutsWorker = getLayoutsWorker()
      if (!layoutsWorker) throw new Error("no layouts worker")
      await layoutsWorker.processLayout(layoutKey)
      const vanillaColumn = await layoutsDB.vanillaColumns.get(strLayoutKey)
      if (!vanillaColumn)
        throw new Error(`no vanilla column for ${strLayoutKey}`)
      return vanillaColumn.vanillaColumn
    }
  }, [])

  const maxLength = 25
  const maxCount = floor(max(0, maxLength - length) / vanillaColumn.length)
  const maxColumnZs = pipe(
    NEA.range(0, maxCount - 1),
    A.map((i) => i * vanillaColumn.length)
  )

  const columnZsUp = useMemo(
    () =>
      pipe(
        maxColumnZs,
        A.takeLeftWhile((columnZ) => {
          const center = new Vector3(0, 0, 0)

          const halfSize = new Vector3(
            width / 2,
            height / 2,
            vanillaColumn.length / 2
          )

          const obb = new OBB(center, halfSize)

          const mat = reactHouseMatrix
            .clone()
            .multiply(new Matrix4().makeTranslation(0, 0, length / 2 + columnZ))

          obb.applyMatrix4(mat)

          const collision = collideOBB(obb, [houseId])

          return !collision
        })
      ),
    [
      height,
      houseId,
      length,
      maxColumnZs,
      reactHouseMatrix,
      vanillaColumn.length,
      width,
    ]
  )
  const maxStretchLengthUp = columnZsUp?.[columnZsUp.length - 1] ?? 0

  const columnZsDown = useMemo(
    () =>
      pipe(
        maxColumnZs,
        A.map((x) => -1 * x),
        A.takeLeftWhile((columnZ) => {
          const center = new Vector3(0, 0, 0)

          const halfSize = new Vector3(
            width / 2,
            height / 2,
            vanillaColumn.length / 2
          )

          const obb = new OBB(center, halfSize)

          const mat = reactHouseMatrix
            .clone()
            .multiply(
              new Matrix4().makeTranslation(0, 0, -(length / 2) + columnZ)
            )

          obb.applyMatrix4(mat)

          const collision = collideOBB(obb, [houseId])

          return !collision
        })
      ),
    [
      maxColumnZs,
      width,
      height,
      vanillaColumn.length,
      reactHouseMatrix,
      length,
      houseId,
    ]
  )
  const maxStretchLengthDown = columnZsDown?.[columnZsDown.length - 1] ?? 0

  const columnsUp = pipe(
    columnZsUp,
    A.map((columnZ) => (
      <group key={columnZ} position={[0, 0, columnZ]}>
        <GroupedStretchColumn
          key={columnZ}
          {...{
            gridGroups: vanillaColumn.gridGroups,
            systemId,
            houseId,
            direction: 1,
            columnZ,
            columnLength: vanillaColumn.length,
          }}
        />
      </group>
    )),
    (columns) => (
      <group position={[0, 0, length - endColumn.length]}>{columns}</group>
    )
  )

  const columnsDown = pipe(
    columnZsDown,
    A.map((columnZ) => (
      <group key={columnZ} position={[0, 0, columnZ]}>
        <GroupedStretchColumn
          key={columnZ}
          {...{
            gridGroups: vanillaColumn.gridGroups,
            systemId,
            houseId,
            direction: -1,
            columnZ,
            columnLength: vanillaColumn.length,
          }}
        />
      </group>
    )),
    (columns) => <group position={[0, 0, startColumn.length]}>{columns}</group>
  )

  return {
    columnsUp,
    columnsDown,
    maxStretchLengthDown,
    maxStretchLengthUp,
  }
}
