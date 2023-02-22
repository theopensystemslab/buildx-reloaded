import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef, useState } from "react"
import { Group } from "three"
import { useHouseMaterialOps } from "../../hooks/hashedMaterials"
import { useHouseElementOutline } from "../../hooks/highlights"
import { useHouseSystemId } from "../../hooks/houses"
import { useHouseColumnLayout } from "../../hooks/layouts"
import { useIsMoveRotateable, useIsStretchable } from "../../hooks/siteCtx"
import { useStretchLength } from "../../hooks/transients/stretchLength"
import { useStretchWidth } from "../../hooks/transients/stretchWidth"
import {
  usePostTransformsTransients,
  usePreTransformsTransients,
} from "../../hooks/transients/transforms"
import { RA } from "../../utils/functions"
import RotateHandles from "../handles/RotateHandles"
import StretchHandle from "../handles/StretchHandle"
import GroupedColumn from "./GroupedColumn"
import PhonyHouse from "./stretchWidth/PhonyHouse"

type Props = {
  houseId: string
}

const GroupedHouse = (props: Props) => {
  const { houseId } = props

  const houseGroupRef = useRef<Group>(null!)
  const startRef = useRef<Group>(null!)
  const endRef = useRef<Group>(null!)

  const systemId = useHouseSystemId(houseId)

  const layout = useHouseColumnLayout(houseId)

  const { startColumn, midColumns, endColumn, columnsUp, columnsDown } =
    useStretchLength({ houseId, layout, startRef, endRef })

  const startColumnRef = useRef<Group>(null)
  const midColumnsRef = useRef<Group>(null)
  const endColumnRef = useRef<Group>(null)
  const houseRefs = [startColumnRef, midColumnsRef, endColumnRef]

  // const setHouseVisible = (b: boolean) => {
  //   for (let ref of houseRefs) {
  //     if (ref.current) ref.current.visible = b
  //   }
  // }

  const {
    canStretchWidth,
    // minWidth,
    // maxWidth,
    // sendStretchWidthDragDistance,
    // gateLineX,
    // sendWidthDrop,
  } = useStretchWidth(houseId, layout)

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

  usePreTransformsTransients(houseId)
  usePostTransformsTransients(houseId, houseGroupRef)

  useHouseElementOutline(houseId, houseGroupRef)

  const isStretchable = useIsStretchable(houseId)
  const isMoveRotateable = useIsMoveRotateable(houseId)

  useHouseMaterialOps(houseId, houseGroupRef)

  return (
    <Fragment>
      <group ref={houseGroupRef}>
        <PhonyHouse houseId={houseId} />
        <group ref={startRef}>
          <StretchHandle
            houseId={houseId}
            axis="z"
            direction={-1}
            disable={!isStretchable}
          />
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
          <StretchHandle
            houseId={houseId}
            axis="z"
            direction={1}
            disable={!isStretchable}
          />
        </group>
        {isMoveRotateable && <RotateHandles houseId={houseId} />}

        <group scale={isStretchable ? [1, 1, 1] : [0, 0, 0]}>
          {columnsUp}
          {columnsDown}
        </group>

        <StretchHandle
          ref={leftHandleRef}
          houseId={houseId}
          disable={!isStretchable || !canStretchWidth}
          axis="x"
          direction={1}
        />
        <StretchHandle
          ref={rightHandleRef}
          houseId={houseId}
          axis="x"
          direction={-1}
          disable={!isStretchable || !canStretchWidth}
        />
      </group>
    </Fragment>
  )
}

export default GroupedHouse
