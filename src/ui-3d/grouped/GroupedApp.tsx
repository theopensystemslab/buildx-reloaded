import { useDragHandler, useGestures } from "@/hooks/gestures"
import { useHouseKeys } from "@/hooks/houses"
import { usePreviews } from "@/hooks/previews"
import { useRouting } from "@/hooks/routing"
import { RA } from "@/utils/functions"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import GroupedHouse from "./GroupedHouse"

const GroupedApp = () => {
  const houseKeys = useHouseKeys()
  usePreviews()
  const bindAll = useGestures()
  useDragHandler()
  useRouting()

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
