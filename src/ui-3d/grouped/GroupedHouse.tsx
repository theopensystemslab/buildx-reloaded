import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useRef } from "react"
import { Group } from "three"
import { useHouseDimensionsUpdates } from "../../hooks/dimensions"
import { useGlobals } from "../../hooks/globals"
import { useHouse, useHouseSystemId } from "../../hooks/houses"
import { useColumnLayout } from "../../hooks/layouts"
import { SiteCtxModeEnum, useSiteCtxMode } from "../../hooks/siteCtx"
import { splitColumns } from "../../hooks/stretch"
import postTransients, {
  usePostTransientHouseTransforms,
} from "../../hooks/transients/post"
import { usePreTransient } from "../../hooks/transients/pre"
import { RA } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import { DebugDimensionsBox } from "../debug/DebugDimensions"
import GroupedColumn from "./GroupedColumn"

type Props = {
  houseId: string
}

const GroupedHouse = (props: Props) => {
  const { houseId } = props
  const systemId = useHouseSystemId(houseId)

  const columnLayout = useColumnLayout(houseId)
  const { startColumn, midColumns, endColumn } = splitColumns(columnLayout)

  useHouseDimensionsUpdates(houseId)
  usePreTransient(houseId)

  const house = useHouse(houseId)

  const houseGroupRef = useRef<Group>(null!)

  const { debug } = useGlobals()

  useSubscribeKey(postTransients, houseId, () => {
    if (!postTransients?.[houseId]) return
    const { position } = postTransients[houseId]
    if (!position) return
    houseGroupRef.current.position.set(
      house.position.x + position.dx,
      house.position.y + position.dy,
      house.position.z + position.dz
    )
  })

  return (
    <Fragment>
      <group
        ref={houseGroupRef}
        position={[house.position.x, house.position.y, house.position.z]}
        rotation={[0, house.rotation, 0]}
      >
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
      </group>

      {debug && <DebugDimensionsBox houseId={houseId} />}
    </Fragment>
  )
}

export default GroupedHouse
