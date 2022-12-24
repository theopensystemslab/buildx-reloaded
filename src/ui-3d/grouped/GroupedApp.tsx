import { useHouseKeys } from "@/hooks/houses"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { useDragHandler, useGestures } from "../../hooks/gestures"
import { RA } from "../../utils/functions"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import GroupedHouse from "./GroupedHouse"

const GroupedApp = () => {
  const houseKeys = useHouseKeys()
  const bindAll = useGestures()
  useDragHandler()
  return (
    <Fragment>
      <group {...bindAll()}>
        {pipe(
          houseKeys,
          RA.map((houseId) => (
            <Suspense key={houseId} fallback={null}>
              <GroupedHouse houseId={houseId} />
            </Suspense>
          ))
        )}
      </group>
      <XZPlane />
      <YPlane />
    </Fragment>
  )
}

export default GroupedApp
