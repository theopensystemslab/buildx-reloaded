import { identity, pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { useHouses } from "../../hooks/houses"
import { useEvents } from "../../hooks/old-events"
import { useSiteCtx } from "../../hooks/siteCtx"
import { RA, RR } from "../../utils/functions"
import DefaultHouse from "./DefaultHouse"
// import ElementInstances from "./ElementInstances"

const DefaultApp = () => {
  const houses = useHouses()

  const { buildingHouseId: buildingId } = useSiteCtx()

  useEvents()

  return (
    <Fragment>
      {pipe(
        RR.keys(houses),
        buildingId ? RA.filter((id) => id === buildingId) : identity,
        RA.map((id) => (
          <Suspense key={id} fallback={null}>
            <DefaultHouse houseId={id} />
          </Suspense>
        ))
      )}
      {/* <ElementInstances /> */}
    </Fragment>
  )
}

export default DefaultApp
