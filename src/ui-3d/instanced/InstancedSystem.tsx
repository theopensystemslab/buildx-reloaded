import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { House } from "../../data/house"
import { useSystemUniqueDnas } from "../../hooks/houses"
import { A } from "../../utils/functions"
import InstancedModule from "./InstancedModule"

type Props = {
  systemId: string
}

const InstancedSystem = (props: Props) => {
  const { systemId } = props

  const uniqueDnas = useSystemUniqueDnas(systemId)

  return (
    <Fragment>
      {pipe(
        uniqueDnas,
        A.map((uniqueDna) => (
          <InstancedModule
            key={uniqueDna}
            dna={uniqueDna}
            systemId={systemId}
          />
        ))
      )}
    </Fragment>
  )
}

export default InstancedSystem
