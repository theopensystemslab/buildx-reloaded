import { Fragment, useRef } from "react"
import { Group } from "three"
import { useHousesEvents } from "./events/houses"
import useGestures from "./events/gestures"
import useKeyTestInteractions from "./useKeyTestInteractions"
import useModeHandling from "./useModeHandling"
import XZPlane from "../XZPlane"

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  useHousesEvents(rootRef)
  useModeHandling(rootRef)

  const bindAll = useGestures(rootRef)

  useKeyTestInteractions(rootRef)

  return (
    <Fragment>
      <group ref={rootRef} {...bindAll()}></group>
      <XZPlane />
      {/* <YPlane /> */}
    </Fragment>
  )
}

export default FreshApp
