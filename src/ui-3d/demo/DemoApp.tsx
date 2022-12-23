import { pipe } from "fp-ts/lib/function"
import React, { Fragment, Suspense } from "react"
import { useGestures } from "../../hooks/gestures"
import { useHouseKeys } from "../../hooks/houses"
import { RA } from "../../utils/functions"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import DemoHouse from "./DemoHouse"

const DemoApp = () => {
  const houseKeys = useHouseKeys()

  const bindAll = useGestures()

  return (
    <Fragment>
      <group {...bindAll()}>
        {pipe(
          houseKeys,
          RA.map((houseId) => (
            <Suspense key={houseId} fallback={null}>
              <DemoHouse houseId={houseId} />
            </Suspense>
          ))
        )}
      </group>
      <XZPlane />
      <YPlane />
    </Fragment>
  )
}

export default DemoApp
