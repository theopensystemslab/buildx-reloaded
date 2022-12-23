import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useHouseDimensionsUpdates } from "../../hooks/dimensions"
import { useHouseSystemId } from "../../hooks/houses"
import { useColumnLayout } from "../../hooks/layouts"
import { splitColumns } from "../../hooks/stretch"
import { usePreTransient } from "../../hooks/transients/pre"
import { RA } from "../../utils/functions"
import DemoColumn from "./DemoColumn"

type Props = {
  houseId: string
}

const DemoHouse = (props: Props) => {
  const { houseId } = props
  const systemId = useHouseSystemId(houseId)

  const columnLayout = useColumnLayout(houseId)
  const { startColumn, midColumns, endColumn } = splitColumns(columnLayout)

  useHouseDimensionsUpdates(houseId)
  usePreTransient(houseId)

  return (
    <Fragment>
      <DemoColumn
        key={`${houseId}:${startColumn.columnIndex}`}
        column={startColumn}
        {...{ systemId, houseId, start: true }}
      />
      {pipe(
        midColumns,
        RA.map((column) => (
          <DemoColumn
            key={`${houseId}:${column.columnIndex}`}
            column={column}
            {...{ systemId, houseId }}
          />
        ))
      )}
      <DemoColumn
        key={`${houseId}:${endColumn.columnIndex}`}
        column={endColumn}
        {...{ systemId, houseId, end: true }}
      />
    </Fragment>
  )
}

export default DemoHouse
