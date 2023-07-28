import { useRef } from "react"
import { Group } from "three"
import { useHousesEvents } from "./events/houses"
import useGestures from "./useGestures"
import useModeHandling from "./useModeHandling"

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  useHousesEvents(rootRef)
  useModeHandling(rootRef)

  const bindAll = useGestures()

  return (
    <group ref={rootRef} {...bindAll()}>
      {/* <XZPlane />
      <YPlane /> */}
    </group>
  )
}

export default FreshApp
