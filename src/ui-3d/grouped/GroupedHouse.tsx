import { Instance } from "@react-three/drei"
import { advance, invalidate, useFrame } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef } from "react"
import { Group, Vector3 } from "three"
import {
  useHouseDimensions,
  useHouseDimensionsUpdates,
} from "../../hooks/dimensions"
import { useGlobals } from "../../hooks/globals"
import houses, { useHouse, useHouseSystemId } from "../../hooks/houses"
import { useColumnLayout } from "../../hooks/layouts"
import { EditModeEnum, useEditMode } from "../../hooks/siteCtx"
import { splitColumns } from "../../hooks/stretch"
import postTransients from "../../hooks/transients/post"
import { usePreTransient } from "../../hooks/transients/pre"
import { RA } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import { PI } from "../../utils/math"
import { yAxis } from "../../utils/three"
import { DebugDimensionsBox } from "../debug/DebugDimensions"
import GroupedColumn from "./GroupedColumn"

type Props = {
  houseId: string
}

const RotateHandles = ({ houseId }: { houseId: string }) => {
  const { length: houseLength, width: houseWidth } = useHouseDimensions(houseId)
  return (
    <Fragment>
      <Instance
        rotation-x={-PI / 2}
        position={[0, 0, -1.5]}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.MOVE_ROTATE,
          },
        }}
      />
      <Instance
        rotation-x={-PI / 2}
        position={[-houseWidth / 2 - 1.5, 0, houseLength / 2]}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.MOVE_ROTATE,
          },
        }}
      />
    </Fragment>
  )
}

const GroupedHouse = (props: Props) => {
  const { houseId } = props
  const systemId = useHouseSystemId(houseId)

  const columnLayout = useColumnLayout(houseId)
  const { startColumn, midColumns, endColumn } = splitColumns(columnLayout)

  const { length: houseLength } = useHouseDimensionsUpdates(houseId)

  usePreTransient(houseId)

  const houseGroupRef = useRef<Group>(null!)

  const { debug } = useGlobals()

  const tPosV = useRef(new Vector3())

  useSubscribeKey(
    postTransients,
    houseId,
    () => {
      const house = houses[houseId]
      if (!house) return

      const { position, rotation } = postTransients[houseId] ?? {}

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

  const editMode = useEditMode()

  return (
    <Fragment>
      <group ref={houseGroupRef}>
        <GroupedColumn
          key={`${houseId}:${startColumn.columnIndex}`}
          column={startColumn}
          {...{ systemId, houseId, start: true }}
        />
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
        <GroupedColumn
          key={`${houseId}:${endColumn.columnIndex}`}
          column={endColumn}
          {...{ systemId, houseId, end: true }}
        />
        {editMode === EditModeEnum.Enum.MOVE_ROTATE && (
          <RotateHandles houseId={houseId} />
        )}
      </group>
      {debug && <DebugDimensionsBox houseId={houseId} />}
    </Fragment>
  )
}

export default GroupedHouse
