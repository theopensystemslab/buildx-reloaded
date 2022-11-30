import houses from "@/hooks/houses"
import { useColumnLayout } from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useHouseDimensionsUpdates } from "../../hooks/dimensions"
import { splitColumns } from "../../hooks/stretch"
import { usePreTransient } from "../../hooks/transients/pre"
import { RA } from "../../utils/functions"
import DefaultColumn from "./DefaultColumn"

type Props = {
  houseId: string
}

const DefaultHouse = (props: Props) => {
  const { houseId } = props
  const systemId = houses[houseId].systemId

  const columnLayout = useColumnLayout(houseId)

  const { startColumn, midColumns, endColumn } = splitColumns(columnLayout)

  useHouseDimensionsUpdates(houseId)

  usePreTransient(houseId)

  return (
    <Fragment>
      <DefaultColumn
        column={startColumn}
        {...{ systemId, houseId, startColumn: true }}
      />
      {pipe(
        midColumns,
        RA.map((column) => (
          <DefaultColumn
            key={`${houseId}:${column.columnIndex}`}
            column={column}
            {...{ systemId, houseId }}
          />
        ))
      )}
      <DefaultColumn
        column={endColumn}
        {...{ systemId, houseId, endColumn: true }}
      />
    </Fragment>
  )
}

export default DefaultHouse
