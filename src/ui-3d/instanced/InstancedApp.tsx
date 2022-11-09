import { identity, pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { useHouses } from "../../hooks/houses"
import { useSiteCtx } from "../../hooks/siteCtx"
import { pipeLogWith, RA, RR } from "../../utils/functions"
import InstancedHouse from "./InstancedHouse"
import ElementInstances from "./ElementInstances"

const InstancedApp = () => {
  const houses = useHouses()

  const { buildingHouseId: buildingId } = useSiteCtx()

  return (
    <Fragment>
      {pipe(
        RR.keys(houses),

        pipeLogWith((x) => x.length),
        buildingId ? RA.filter((id) => id === buildingId) : identity,
        RA.map((id) => (
          <Suspense key={id} fallback={null}>
            <InstancedHouse houseId={id} />
          </Suspense>
        ))
      )}
      <ElementInstances />
    </Fragment>
  )
}

export default InstancedApp
