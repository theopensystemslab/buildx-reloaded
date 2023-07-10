"use client"
import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, memo, RefObject, useMemo } from "react"
import { suspend } from "suspend-react"
import { Group, Matrix4, Vector3 } from "three"
import { OBB } from "three-stdlib"
import layoutsDB, {
  LayoutKey,
  PositionedColumn,
  serializeLayoutKey,
} from "../../../db/layouts"
import { A, NEA } from "../../../utils/functions"
import { floor, max, round, sign } from "../../../utils/math"
import { yAxis } from "../../../utils/three"
import { getLayoutsWorker } from "../../../workers"
import { columnLayoutToDnas } from "../../../workers/layouts/worker"
import GroupedStretchColumn from "../../ui-3d/grouped/stretchLength/GroupedStretchColumn"
import { collideOBB } from "../dimensions"
import {
  dispatchZStretchHouse,
  useZStretchHouseIntentListener,
  useZStretchHouseListener,
} from "../events"
import houses, { useSetHouse } from "../houses"
import { vanillaColumns } from "../vanilla"

type Props = {
  houseId: string
  layoutKey: LayoutKey
  reactHouseMatrix: Matrix4
  width: number
  height: number
  length: number
  startColumn: PositionedColumn
  endColumn: PositionedColumn
  midColumns: PositionedColumn[]
  startRef: RefObject<Group>
  endRef: RefObject<Group>
}

const ZStretch = ({
  houseId,
  layoutKey,
  reactHouseMatrix,
  width,
  height,
  length,
  startColumn,
  endColumn,
  midColumns,
  startRef,
  endRef,
}: Props) => {
  console.log("ZStretch")
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

  console.log([...columnZsUp, ...columnZsUp])

  const columnsUp = pipe(
    columnZsUp,
    A.mapWithIndex((i, columnZ) => (
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
            i,
            layoutKey,
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
    A.mapWithIndex((i, columnZ) => (
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
            i: i + 1,
            layoutKey,
          }}
        />
      </group>
    )),
    (columns) => <group position={[0, 0, startColumn.length]}>{columns}</group>
  )

  useZStretchHouseIntentListener((detail) => {
    if (detail.houseId !== houseId) return

    // if (!startRef.current || !endRef.current) return

    const { distance, direction, dx, dz, last } = detail

    console.log(distance)

    switch (direction) {
      case 1: {
        const clamped = -distance > length || distance > maxStretchLengthUp
        if (!clamped) {
          endRef.current?.position.set(0, 0, distance)
          dispatchZStretchHouse(detail)
        }
        break
      }

      case -1: {
        const clamped = distance > length || distance < maxStretchLengthDown
        if (!clamped) {
          startRef.current?.position.set(0, 0, distance)
          dispatchZStretchHouse(detail)
        }
        break
      }
    }

    invalidate()
  })

  const setHouse = useSetHouse(houseId)

  useZStretchHouseListener((detail) => {
    if (detail.houseId !== houseId || !detail.last) return

    const { direction, distance } = detail

    const delta = round(distance / vanillaColumn.length)

    const dxdz = new Vector3(0, 0, delta * vanillaColumn.length)

    dxdz.applyAxisAngle(yAxis, houses[houseId].rotation)

    const { x: dx, z: dz } = dxdz

    const { x, y, z } = houses[houseId].position

    switch (direction) {
      case 1: {
        if (sign(delta) === 1) {
          setHouse({
            ...houses[houseId],
            dnas: columnLayoutToDnas([
              startColumn,
              ...midColumns,
              ...A.replicate(delta, {
                gridGroups: vanillaColumn.gridGroups,
              }),
              endColumn,
            ]),
            position: {
              x: x + dx / 2,
              y,
              z: z + dz / 2,
            },
          })
        } else if (sign(delta) === -1) {
          setHouse({
            ...houses[houseId],
            dnas: columnLayoutToDnas([
              startColumn,
              ...midColumns.slice(0, midColumns.length + delta),
              endColumn,
            ]),
            position: {
              x: x + dx / 2,
              y,
              z: z + dz / 2,
            },
          })
        }
        break
      }
      case -1: {
        if (sign(delta) === -1) {
          const { x, y, z } = houses[houseId].position
          houses[houseId] = {
            ...houses[houseId],
            dnas: columnLayoutToDnas([
              startColumn,
              ...A.replicate(-delta, {
                gridGroups: vanillaColumn.gridGroups,
              }),
              ...midColumns,
              endColumn,
            ]),
            position: {
              x: x + dx / 2,
              y,
              z: z + dz / 2,
            },
          }
        } else if (sign(delta) === 1) {
          houses[houseId] = {
            ...houses[houseId],
            dnas: columnLayoutToDnas([
              startColumn,
              ...midColumns.slice(0, midColumns.length - delta),
              endColumn,
            ]),
            position: {
              x: x + dx / 2,
              y,
              z: z + dz / 2,
            },
          }
        }
        break
      }
    }

    invalidate()
  })

  return (
    <Fragment>
      {columnsUp}
      {columnsDown}
    </Fragment>
  )
}

export default memo(ZStretch)
