import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useMemo, useRef } from "react"
import { Group, Vector3 } from "three"
import { OBB } from "three-stdlib"
import {
  collideOBB,
  useHouseDimensionsUpdates,
  useHouseMatrix,
  useRenderOBB,
} from "../../hooks/dimensions"
import { HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { useDebug } from "../../hooks/globals"
import { useHouseOutline } from "../../hooks/highlights"
import houses, {
  useHouse,
  useHouses,
  useHouseSystemId,
} from "../../hooks/houses"
import { useStretchColumns } from "../../hooks/layouts"
import { EditModeEnum, useEditMode } from "../../hooks/siteCtx"
import { stretchLength } from "../../hooks/transients/stretch"
import {
  postTransformsTransients,
  usePreTransient,
} from "../../hooks/transients/transforms"
import { NEA, RA } from "../../utils/functions"
import { useSubscribe, useSubscribeKey } from "../../utils/hooks"
import { floor, max, min } from "../../utils/math"
import { yAxis } from "../../utils/three"
import RotateHandles from "../handles/RotateHandles"
import StretchHandle from "../handles/StretchHandle"
import GroupedColumn from "./GroupedColumn"
import GroupedStretchColumn from "./stretch/GroupedStretchColumn"

type Props = {
  houseId: string
}

const GroupedHouse = (props: Props) => {
  const { houseId } = props

  const houseGroupRef = useRef<Group>(null!)
  const startRef = useRef<Group>(null!)
  const endRef = useRef<Group>(null!)
  const tPosV = useRef(new Vector3())

  const systemId = useHouseSystemId(houseId)

  const { startColumn, midColumns, endColumn, vanillaColumn } =
    useStretchColumns(houseId)

  const vanillaColumnLength = vanillaColumn[0].length

  const {
    length: houseLength,
    width: houseWidth,
    height: houseHeight,
  } = useHouseDimensionsUpdates(houseId)

  usePreTransient(houseId)

  // const { position, rotation } = useHouse(houseId)

  useSubscribeKey(
    postTransformsTransients,
    houseId,
    () => {
      const house = houses[houseId]
      if (!house) return

      const { position, rotation } = postTransformsTransients[houseId] ?? {}

      const r = house.rotation + (rotation ?? 0)
      const hx = house.position.x + (position?.dx ?? 0)
      const hy = house.position.y + (position?.dy ?? 0)
      const hz = house.position.z + (position?.dz ?? 0)

      houseGroupRef.current.position.set(0, 0, -houseLength / 2)

      houseGroupRef.current.setRotationFromAxisAngle(yAxis, r)
      houseGroupRef.current.position.applyAxisAngle(yAxis, r)

      tPosV.current.set(hx, hy, hz)
      houseGroupRef.current.position.add(tPosV.current)

      invalidate()
    },
    true
  )

  const computeMatrix = useHouseMatrix(houseId)

  const maxLength = 25
  const maxCount = floor(max(0, maxLength - houseLength) / vanillaColumnLength)
  const maxColumnZs = pipe(
    NEA.range(0, maxCount - 1),
    RA.map((i) => i * vanillaColumnLength)
  )

  const renderOBB = useRenderOBB()

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
    [
      computeMatrix,
      houseHeight,
      houseId,
      houseLength,
      houseWidth,
      maxColumnZs,
      vanillaColumnLength,
    ]
  )
  const maxColumnZUp = columnZsUp?.[columnZsUp.length - 1] ?? 0

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
    [
      computeMatrix,
      houseHeight,
      houseId,
      houseLength,
      houseWidth,
      maxColumnZs,
      vanillaColumnLength,
    ]
  )
  const maxColumnZDown = columnZsDown?.[columnZsDown.length - 1] ?? 0

  useSubscribeKey(stretchLength, houseId, () => {
    if (stretchLength[houseId]) {
      const { distance, side } = stretchLength[houseId]
      switch (side) {
        case HandleSideEnum.Enum.FRONT:
          startRef.current.position.set(0, 0, max(distance, maxColumnZDown))
          break
        case HandleSideEnum.Enum.BACK:
          endRef.current.position.set(0, 0, min(distance, maxColumnZUp))
          break
      }
    } else {
      startRef.current.position.set(0, 0, 0)
      endRef.current.position.set(0, 0, 0)
    }
    invalidate()
  })

  const editMode = useEditMode()

  const debug = useDebug()

  useHouseOutline(houseId, houseGroupRef)

  return (
    <Fragment>
      <group ref={houseGroupRef}>
        <group scale={debug ? [0, 0, 0] : [1, 1, 1]}>
          <group ref={startRef}>
            {editMode === EditModeEnum.Enum.STRETCH && (
              <StretchHandle
                houseId={houseId}
                side={HandleSideEnum.Enum.FRONT}
              />
            )}
            <GroupedColumn
              key={`${houseId}:${startColumn.columnIndex}`}
              column={startColumn}
              {...{ systemId, houseId, start: true }}
            />
          </group>
          {pipe(
            midColumns,
            RA.map((column) => (
              <GroupedColumn
                key={`${houseId}:${column.columnIndex}`}
                column={column}
                {...{ systemId, houseId }}
              />
            ))
          )}
          <group ref={endRef}>
            <GroupedColumn
              key={`${houseId}:${endColumn.columnIndex}`}
              column={endColumn}
              {...{ systemId, houseId, end: true }}
            />
            {editMode === EditModeEnum.Enum.STRETCH && (
              <StretchHandle
                houseId={houseId}
                side={HandleSideEnum.Enum.BACK}
              />
            )}
          </group>
          {editMode === EditModeEnum.Enum.MOVE_ROTATE && (
            <RotateHandles houseId={houseId} />
          )}
          {editMode === EditModeEnum.Enum.STRETCH && (
            <Fragment>
              <group position={[0, 0, houseLength - endColumn.length]}>
                {pipe(
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
                  ))
                )}
              </group>
              <group position={[0, 0, startColumn.length]}>
                {pipe(
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
                  ))
                )}
              </group>
            </Fragment>
          )}
        </group>
      </group>
    </Fragment>
  )
}

export default GroupedHouse
