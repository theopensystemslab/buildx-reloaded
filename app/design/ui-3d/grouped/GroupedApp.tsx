"use client"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { usePreviews } from "~/design/state/previews"
import { useRouting } from "~/design/state/routing"
import { RA } from "~/utils/functions"
import { useExportersWorker } from "../../state/exporters"
import { useDragHandler, useGestures } from "../../state/gestures"
import { useHouseKeys, useLocallyStoredHouses } from "../../state/houses"
import { useSharingWorker } from "../../state/sharing"
import { useLocallyStoredSiteCtx } from "../../state/siteCtx"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import GroupedHouse from "./GroupedHouse"

const GroupedApp = () => {
  const houseKeys = useHouseKeys()

  useLocallyStoredHouses()
  useLocallyStoredSiteCtx()

  usePreviews()
  const bindAll = useGestures()
  useDragHandler()
  useRouting()

  useExportersWorker()
  useSharingWorker()

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
