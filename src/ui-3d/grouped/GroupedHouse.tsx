import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Group } from "three"
import { useHouseDimensionsUpdates } from "../../hooks/dimensions"
import { useHouse, useHouseSystemId } from "../../hooks/houses"
import { useColumnLayout } from "../../hooks/layouts"
import { splitColumns } from "../../hooks/stretch"
import { usePreTransient } from "../../hooks/transients/pre"
import { RA } from "../../utils/functions"
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

  return (
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
  )
}

export default GroupedHouse
