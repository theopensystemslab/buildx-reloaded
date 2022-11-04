import { Instances } from "@react-three/drei"
import { identity, pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { useHouses } from "../../hooks/houses"
import { useSiteCtx } from "../../hooks/siteCtx"
import { RA, RR } from "../../utils/functions"
import GltfHouse from "./GltfHouse"
import Instantiaminatrixificator from "./Instantiaminatrixificator"

const GltfApp = () => {
  const houses = useHouses()

  const { buildingHouseId: buildingId } = useSiteCtx()

  return (
    <Fragment>
      {pipe(
        RR.keys(houses),
        buildingId ? RA.filter((id) => id === buildingId) : identity,
        RA.map((id) => (
          <Suspense key={id} fallback={null}>
            <GltfHouse id={id} />
          </Suspense>
        ))
      )}
      <Instantiaminatrixificator />
    </Fragment>
  )
}

export default GltfApp
