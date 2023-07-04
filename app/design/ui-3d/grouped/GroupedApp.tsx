"use client"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { usePreviews } from "~/design/state/previews"
import { A, R } from "~/utils/functions"
import { useExportersWorker } from "../../../workers/exporters/hook"
import { useDragHandler, useGestures } from "../../state/gestures"
import { useHouses } from "../../state/houses"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import GroupedHouse2 from "./GroupedHouse2"

const GroupedApp = () => {
  const houses = useHouses()
  usePreviews()
  const bindAll = useGestures()
  useDragHandler()
  useExportersWorker()

  return (
    <Fragment>
      <group {...bindAll()}>
        {pipe(
          houses,
          R.toArray,
          A.map(([houseId, house]) => (
            <Suspense key={houseId} fallback={null}>
              <GroupedHouse2 house={house} />
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
