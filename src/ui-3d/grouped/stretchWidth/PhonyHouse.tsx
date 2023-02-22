import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useHouseSystemId } from "../../../hooks/houses"
import { useDnaColumnLayout } from "../../../hooks/layouts"
import { useHousePreviews } from "../../../hooks/previews"
import { A } from "../../../utils/functions"
import PhonyColumn from "./PhonyColumn"

type Props = {
  houseId: string
}

const PhonyHouse = (props: Props) => {
  const { houseId } = props
  const systemId = useHouseSystemId(houseId)
  const housePreviews = useHousePreviews(houseId)
  const dna = housePreviews.dna ?? []
  const layout = useDnaColumnLayout(houseId, dna)

  return (
    <Fragment>
      {pipe(
        layout,
        A.map((column) => (
          <PhonyColumn
            key={`${houseId}:${column.columnIndex}`}
            column={column}
            {...{ systemId, houseId }}
          />
        ))
      )}
    </Fragment>
  )
}

export default PhonyHouse
