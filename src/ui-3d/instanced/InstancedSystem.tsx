import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { House } from "../../data/house"
import { useSystemUniqueDnas } from "../../hooks/houses"
import { A } from "../../utils/functions"
import InstancedSystemModules from "./InstancedSystemModules"

type Props = {
  systemId: string
}

//

const InstancedSystem = (props: Props) => {
  const { systemId } = props

  const uniqueDnas = useSystemUniqueDnas(systemId)

  // Do I need elements merged or unmerged?

  // maybe split out two settings contexts:
  //  a) user-facing e.g. site vs. house vs. building scope/level
  //  b) code-facing e.g. geometryMerge: House | Module

  // assume geometryMerge: Module for now

  return (
    <Fragment>
      {pipe(
        uniqueDnas,
        A.map((uniqueDna) => (
          <InstancedSystemModules
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
