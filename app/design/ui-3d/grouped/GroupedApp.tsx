"use client"
import { usePreviews } from "~/design/state/previews"
import { useRouting } from "~/design/state/routing"
import { RA } from "~/utils/functions"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense, useEffect, useRef } from "react"
import { useDragHandler, useGestures } from "../../state/gestures"
import houses, { useHouseKeys } from "../../state/houses"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import GroupedHouse from "./GroupedHouse"
import { Remote, wrap } from "comlink"
import { ExportersWorkerAPI } from "../../state/exporters/worker"
import { subscribe } from "valtio"
import { useExportOBJEvents } from "../../state/exporters"

const GroupedApp = () => {
  const houseKeys = useHouseKeys()
  usePreviews()
  const bindAll = useGestures()
  useDragHandler()
  useRouting()

  useExportOBJEvents()

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
