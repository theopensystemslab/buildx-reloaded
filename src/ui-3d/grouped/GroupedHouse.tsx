import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef } from "react"
import { Group, Vector3 } from "three"
import dimensions from "../../hooks/dimensions"
import { HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { useDebug } from "../../hooks/globals"
import { useHouseOutline } from "../../hooks/highlights"
import houses, { useHouseSystemId } from "../../hooks/houses"
import { useColumnLayout } from "../../hooks/layouts"
import {
  useEditMode,
  useIsMoveRotateable,
  useIsStretchable,
} from "../../hooks/siteCtx"
import {
  stretchLengthClamped,
  stretchLengthRaw,
  useStretchLength,
} from "../../hooks/transients/stretch"
import {
  postTransformsTransients,
  usePreTransient,
} from "../../hooks/transients/transforms"
import { RA } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import { max, min } from "../../utils/math"
import { yAxis } from "../../utils/three"
import RotateHandles from "../handles/RotateHandles"
import StretchHandle from "../handles/StretchHandle"
import GroupedColumn from "./GroupedColumn"

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

  const layout = useColumnLayout(houseId)

  const {
    startColumn,
    midColumns,
    endColumn,
    columnsUp,
    columnsDown,
    maxStretchUp,
    maxStretchDown,
  } = useStretchLength(houseId, layout)

  usePreTransient(houseId)

  useSubscribeKey(
    postTransformsTransients,
    houseId,
    () => {
      const house = houses[houseId]
      if (!house) return

      const houseLength = dimensions[houseId].length

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

  useSubscribeKey(stretchLengthRaw, houseId, () => {
    if (stretchLengthRaw[houseId]) {
      const { distance, side, dx, dz } = stretchLengthRaw[houseId]
      switch (side) {
        case HandleSideEnum.Enum.FRONT: {
          const clamped = distance < maxStretchDown
          if (!clamped) {
            startRef.current.position.set(0, 0, distance)
            stretchLengthClamped[houseId] = {
              distance,
              side,
              dx,
              dz,
            }
          }
          break
        }
        case HandleSideEnum.Enum.BACK: {
          const clamped = distance > maxStretchUp
          if (!clamped) {
            endRef.current.position.set(0, 0, distance)
            stretchLengthClamped[houseId] = {
              distance,
              side,
              dx,
              dz,
            }
          }
          break
        }
      }
    } else {
      startRef.current.position.set(0, 0, 0)
      endRef.current.position.set(0, 0, 0)
    }
    invalidate()
  })

  const debug = useDebug()

  useHouseOutline(houseId, houseGroupRef)

  const isStretchable = useIsStretchable(houseId)
  const isMoveRotateable = useIsMoveRotateable(houseId)

  return (
    <Fragment>
      <group ref={houseGroupRef}>
        <group scale={debug ? [0, 0, 0] : [1, 1, 1]}>
          <group ref={startRef}>
            {isStretchable && (
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
            {isStretchable && (
              <StretchHandle
                houseId={houseId}
                side={HandleSideEnum.Enum.BACK}
              />
            )}
          </group>
          {isMoveRotateable && <RotateHandles houseId={houseId} />}
          {isStretchable && (
            <Fragment>
              {columnsUp}
              {columnsDown}
            </Fragment>
          )}
        </group>
      </group>
    </Fragment>
  )
}

export default GroupedHouse
