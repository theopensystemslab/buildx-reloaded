import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useDnaColumnLayout } from "../../../hooks/layouts"
import { A } from "../../../utils/functions"
import PhonyColumn from "./PhonyColumn"

type Props = {
  houseId: string
  systemId: string
  dna: string[]
}

const PhonyDnaHouse = (props: Props) => {
  const { houseId, systemId, dna } = props
  const layout = useDnaColumnLayout(systemId, dna)

  return (
    <Fragment>
      {pipe(
        layout,
        A.map((column) => (
          <PhonyColumn
            key={`${houseId}:${column.columnIndex}`}
            {...{ systemId, houseId, column }}
          />
        ))
      )}
    </Fragment>
  )
}

export default PhonyDnaHouse
