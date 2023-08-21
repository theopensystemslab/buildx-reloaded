import { Fragment, useRef } from "react"
import { Group } from "three"
import XZPlane from "../XZPlane"
import { useHousesEvents } from "./events/houses"
import useModeChange from "./events/modeChange"
import useGestures from "./gestures"

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  useHousesEvents(rootRef)
  useModeChange(rootRef)
  const bindAll = useGestures()

  return (
    <Fragment>
      <group ref={rootRef} {...bindAll()}></group>
      <XZPlane />
    </Fragment>
  )
}

export default FreshApp
