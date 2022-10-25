import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useHousesSystems as useHousesSystemIds } from "../../hooks/houses"
import { RA } from "../../utils/functions"
import InstancedSystem from "./InstancedSystem"

const InstancedApp = () => {
  const systemIds = useHousesSystemIds()

  return (
    <Fragment>
      {pipe(
        systemIds,
        RA.map((systemId) => (
          <InstancedSystem key={systemId} systemId={systemId} />
        ))
      )}
    </Fragment>
  )
}

export default InstancedApp
