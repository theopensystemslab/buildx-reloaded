import { identity, pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { useHouses } from "../../hooks/houses"
import { useSiteCtx } from "../../hooks/siteCtx"
import { RA, RR } from "../../utils/functions"
import ElementInstances from "./ElementInstances"
import InstancedHouse from "./InstancedHouse"

const InstancedApp = () => {
  const houses = useHouses()

  const { buildingHouseId: buildingId } = useSiteCtx()

  return (
    <Fragment>
      {pipe(
        RR.keys(houses),

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
