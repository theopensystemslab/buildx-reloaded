"use client"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { usePreviews } from "~/design/state/previews"
import { useRouting } from "~/design/state/routing"
import { A, R } from "~/utils/functions"
import { useDragHandler, useGestures } from "../../state/gestures"
import { useHouses } from "../../state/houses"
import { useExportersWorker } from "../../workers/exporters"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import GroupedHouse2 from "./GroupedHouse2"

const GroupedApp = () => {
  const houses = useHouses()
  usePreviews()
  const bindAll = useGestures()
  useDragHandler()
  useRouting()

  useExportersWorker()

  return (
    <Fragment>
      <group {...bindAll()}>
        {pipe(
          houses,
          R.toArray,
          A.map(([houseId, house]) => (
            <GroupedHouse2 key={houseId} house={house} />
          ))
        )}
      </group>
      <XZPlane />
      <YPlane />
    </Fragment>
  )
}

export default GroupedApp
