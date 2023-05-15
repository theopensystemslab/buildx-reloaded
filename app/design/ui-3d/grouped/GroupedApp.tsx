"use client"
import { usePreviews } from "~/design/state/previews"
import { useRouting } from "~/design/state/routing"
import { RA } from "~/utils/functions"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { useDragHandler, useGestures } from "../../state/gestures"
import { useHouseKeys } from "../../state/houses"
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
