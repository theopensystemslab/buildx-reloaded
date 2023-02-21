import { invalidate, ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { Group, Mesh, Plane, Vector3 } from "three"
import dimensions from "../../hooks/dimensions"
import { HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { useDebug } from "../../hooks/globals"
import { useHouseMaterialOps } from "../../hooks/hashedMaterials"
import { useHouseElementOutline } from "../../hooks/highlights"
import houses, { useHouseSystemId } from "../../hooks/houses"
import { useColumnLayout } from "../../hooks/layouts"
import { useIsMoveRotateable, useIsStretchable } from "../../hooks/siteCtx"
import {
  stretchLengthClamped,
  stretchLengthRaw,
  useStretchLength,
} from "../../hooks/transients/stretchLength"
import { useStretchWidth } from "../../hooks/transients/stretchWidth"
import {
  postTransformsTransients,
  usePreTransient,
} from "../../hooks/transients/transforms"
import { RA } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import { max, min, sign } from "../../utils/math"
import { isMesh, yAxis } from "../../utils/three"
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
    maxStretchLengthUp,
    maxStretchLengthDown,
  } = useStretchLength(houseId, layout)

  const startColumnRef = useRef<Group>(null)
  const midColumnsRef = useRef<Group>(null)
  const endColumnRef = useRef<Group>(null)
  const houseRefs = [startColumnRef, midColumnsRef, endColumnRef]

  const setHouseVisible = (b: boolean) => {
    for (let ref of houseRefs) {
      if (ref.current) ref.current.visible = b
    }
  }

  const {
    canStretchWidth,
    minWidth,
    maxWidth,
    gateLineX,
    sendWidthDrag,
    sendWidthDrop,
  } = useStretchWidth(houseId, layout, [
    startColumnRef,
    midColumnsRef,
    endColumnRef,
  ])

  const rightHandleRef = useRef<Group>(null!)
  const leftHandleRef = useRef<Group>(null!)

  let widthHandleDragging = false
  const [widthGatesEnabled, setWidthGatesEnabled] = useState(false)

  const widthStretchHoverHandler: Handler<
    "hover",
    ThreeEvent<PointerEvent>
  > = ({ hovering }) => {
    if (widthHandleDragging) return
    if (!widthGatesEnabled && hovering) setWidthGatesEnabled(true)
    if (widthGatesEnabled && !hovering) setWidthGatesEnabled(false)
  }

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
      const { distanceX, distanceZ, side, dx, dz } = stretchLengthRaw[houseId]

      const { length: houseLength, width: houseWidth } = dimensions[houseId]

      switch (side) {
        case HandleSideEnum.Enum.FRONT: {
          const clamped =
            distanceZ > houseLength || distanceZ < maxStretchLengthDown
          if (!clamped) {
            startRef.current.position.set(0, 0, distanceZ)
            stretchLengthClamped[houseId] = {
              distanceX,
              distanceZ,
              side,
              dx,
              dz,
            }
          }
          break
        }
        case HandleSideEnum.Enum.BACK: {
          const clamped =
            -distanceZ > houseLength || distanceZ > maxStretchLengthUp
          if (!clamped) {
            endRef.current.position.set(0, 0, distanceZ)
            stretchLengthClamped[houseId] = {
              distanceX,
              distanceZ,
              side,
              dx,
              dz,
            }
          }
          break
        }

        case HandleSideEnum.Enum.LEFT: {
          const clampUp = distanceX > maxWidth - houseWidth
          const clampDown =
            sign(distanceX) === -1 && distanceX < -(houseWidth - minWidth)

          console.log({ clampUp, clampDown })

          if (clampUp) {
            setHouseVisible(false)
          } else {
            setHouseVisible(true)
          }

          const clampedDistanceX =
            sign(distanceX) === -1
              ? max(distanceX, -(houseWidth - minWidth))
              : min(distanceX, maxWidth - houseWidth)

          leftHandleRef.current?.position.set(clampedDistanceX, 0, 0)
          stretchLengthClamped[houseId] = {
            distanceX: clampedDistanceX,
            distanceZ,
            side,
            dx,
            dz,
          }
          break
        }

        case HandleSideEnum.Enum.RIGHT: {
          const clampedDistanceX =
            sign(distanceX) === -1
              ? max(distanceX, -(maxWidth - houseWidth))
              : min(distanceX, houseWidth - minWidth)

          rightHandleRef.current?.position.set(clampedDistanceX, 0, 0)
          stretchLengthClamped[houseId] = {
            distanceX: clampedDistanceX,
            distanceZ,
            side,
            dx,
            dz,
          }
          break
        }
      }
    } else {
      console.log("else")
      startRef.current.position.set(0, 0, 0)
      endRef.current.position.set(0, 0, 0)
      rightHandleRef.current.position.set(0, 0, 0)
      leftHandleRef.current.position.set(0, 0, 0)
    }
    invalidate()
  })

  useHouseElementOutline(houseId, houseGroupRef)

  const isStretchable = useIsStretchable(houseId)
  const isMoveRotateable = useIsMoveRotateable(houseId)

  useHouseMaterialOps(houseId, houseGroupRef)

  return (
    <Fragment>
      <group ref={houseGroupRef}>
        <group ref={startRef}>
          {isStretchable && (
            <StretchHandle houseId={houseId} side={HandleSideEnum.Enum.FRONT} />
          )}
          <GroupedColumn
            ref={startColumnRef}
            key={`${houseId}:${startColumn.columnIndex}`}
            column={startColumn}
            {...{ systemId, houseId, start: true }}
          />
        </group>
        <group ref={midColumnsRef}>
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
        </group>
        <group ref={endRef}>
          <GroupedColumn
            ref={endColumnRef}
            key={`${houseId}:${endColumn.columnIndex}`}
            column={endColumn}
            {...{ systemId, houseId, end: true }}
          />
          {isStretchable && (
            <StretchHandle houseId={houseId} side={HandleSideEnum.Enum.BACK} />
          )}
        </group>
        {isMoveRotateable && <RotateHandles houseId={houseId} />}
        {isStretchable && (
          <Fragment>
            {columnsUp}
            {columnsDown}
          </Fragment>
        )}
        {isStretchable && canStretchWidth && (
          <Fragment>
            <StretchHandle
              ref={leftHandleRef}
              houseId={houseId}
              side={HandleSideEnum.Enum.LEFT}
              // onHover={widthStretchHoverHandler}
              // onDrag={({ first, last }) => {
              //   if (!leftHandleRef.current) return

              //   if (first) {
              //     widthHandleDragging = true
              //   }

              //   const [px] = rotateVector(pointer.xz)
              //   const [bx] = rotateVector([buildingX, buildingZ])

              //   const leftClamp = clamp(
              //     minWidth / 2 + handleOffset,
              //     maxWidth / 2 + handleOffset
              //   )

              //   const x = pipe(px - bx, leftClamp)

              //   leftHandleRef.current.position.x = x
              //   sendWidthDrag(x - handleOffset)

              //   if (last) {
              //     widthHandleDragging = false
              //     leftHandleRef.current.position.x =
              //       houseWidth / 2 + handleOffset
              //     sendWidthDrop()
              //   }
              // }}
              // position={[houseWidth / 2 + handleOffset, 0, houseLength / 2]}
            />
            <StretchHandle
              ref={rightHandleRef}
              houseId={houseId}
              side={HandleSideEnum.Enum.RIGHT}
              // onHover={widthStretchHoverHandler}
              // onDrag={({ first, last }) => {
              //   if (!rightHandleRef.current) return

              //   if (first) {
              //     widthHandleDragging = true
              //   }

              //   const [px] = rotateVector(pointer.xz)
              //   const [bx] = rotateVector([buildingX, buildingZ])

              //   const rightClamp = clamp(
              //     -(maxWidth / 2 + handleOffset),
              //     -(minWidth / 2 + handleOffset)
              //   )

              //   const x = pipe(px - bx, rightClamp)

              //   rightHandleRef.current.position.x = x
              //   sendWidthDrag(x + handleOffset)

              //   if (last) {
              //     widthHandleDragging = false
              //     rightHandleRef.current.position.x = -(
              //       houseWidth / 2 +
              //       handleOffset
              //     )
              //     sendWidthDrop()
              //   }
              // }}
              // position={[-(houseWidth / 2 + handleOffset), 0, houseLength / 2]}
            />
            {/* {widthGatesEnabled && (
              <group position={[0, 0, houseLength / 2]}>
                {[gateLineX, -gateLineX].map((x) => {
                  return (
                    <mesh key={x} position={[x, 0, 0]} rotation-x={Math.PI / 2}>
                      <planeBufferGeometry args={[0.15, houseLength + 10]} />
                      <meshBasicMaterial color="white" side={DoubleSide} />
                    </mesh>
                  )
                })}
              </group>
            )} */}
          </Fragment>
        )}
      </group>
    </Fragment>
  )
}

export default GroupedHouse
