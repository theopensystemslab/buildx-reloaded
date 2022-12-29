import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef } from "react"
import { Group, Vector3 } from "three"
import { useHouseDimensionsUpdates } from "../../hooks/dimensions"
import { HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { useGlobals } from "../../hooks/globals"
import houses, { useHouseSystemId } from "../../hooks/houses"
import { useColumnLayout } from "../../hooks/layouts"
import { EditModeEnum, useEditMode } from "../../hooks/siteCtx"
import { splitColumns } from "../../hooks/transients/stretch"
import {
  postTransients,
  usePreTransient,
} from "../../hooks/transients/transforms"
import { RA } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import { yAxis } from "../../utils/three"
import RotateHandles from "../handles/RotateHandles"
import StretchHandle from "../handles/StretchHandle"
import GroupedColumn from "./GroupedColumn"
import GroupedStretchColumns from "./stretch/GroupedStretchColumns"

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

  const columnLayout = useColumnLayout(houseId)
  const { startColumn, midColumns, endColumn } = splitColumns(columnLayout)

  const { length: houseLength } = useHouseDimensionsUpdates(houseId)

  usePreTransient(houseId)

  const { debug } = useGlobals()

  useSubscribeKey(
    postTransients,
    houseId,
    () => {
      const house = houses[houseId]
      if (!house) return

      const { position, rotation, stretch } = postTransients[houseId] ?? {}

      const r = house.rotation + (rotation ?? 0)
      const hx = house.position.x + (position?.dx ?? 0)
      const hy = house.position.y + (position?.dy ?? 0)
      const hz = house.position.z + (position?.dz ?? 0)

      houseGroupRef.current.position.set(0, 0, -houseLength / 2)

      houseGroupRef.current.setRotationFromAxisAngle(yAxis, r)
      houseGroupRef.current.position.applyAxisAngle(yAxis, r)

      tPosV.current.set(hx, hy, hz)
      houseGroupRef.current.position.add(tPosV.current)

      if (stretch) {
        const { distance, side } = stretch
        switch (side) {
          case HandleSideEnum.Enum.FRONT:
            startRef.current.position.set(0, 0, distance)
            break
          case HandleSideEnum.Enum.BACK:
            endRef.current.position.set(0, 0, distance)
            break
        }
      } else {
        startRef.current.position.set(0, 0, 0)
        endRef.current.position.set(0, 0, 0)
      }

      invalidate()
    },
    true
  )

  const editMode = useEditMode()

  return (
    <Fragment>
      <group ref={houseGroupRef}>
        <group ref={startRef}>
          {editMode === EditModeEnum.Enum.STRETCH && (
            <StretchHandle houseId={houseId} side={HandleSideEnum.Enum.FRONT} />
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
            <StretchHandle houseId={houseId} side={HandleSideEnum.Enum.BACK} />
          )}
        </group>
        {editMode === EditModeEnum.Enum.MOVE_ROTATE && (
          <RotateHandles houseId={houseId} />
        )}
        {editMode === EditModeEnum.Enum.STRETCH && (
          <GroupedStretchColumns houseId={houseId} />
        )}
      </group>
    </Fragment>
  )
}

export default GroupedHouse
