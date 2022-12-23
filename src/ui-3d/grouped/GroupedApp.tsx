import { useHouseKeys } from "@/hooks/houses"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { RA } from "../../utils/functions"
import GroupedHouse from "./GroupedHouse"

const GroupedApp = () => {
  const houseKeys = useHouseKeys()
  // const bindAll = useGestures()
  return (
    <Fragment>
      {pipe(
        houseKeys,
        RA.map((houseId) => (
          <Suspense key={houseId} fallback={null}>
            <GroupedHouse houseId={houseId} />
          </Suspense>
        ))
      )}
    </Fragment>
  )
}

export default GroupedApp
