import { useGesture } from "@use-gesture/react"
import { Fragment, PropsWithChildren, useRef } from "react"
import { Mesh } from "three"
import elementDragEvents from "../../hooks/dragEvents"
import { useSubscribeKey } from "../../utils/hooks"
import XZPlane from "../XZPlane"

const R3FEventsGroup = (props: PropsWithChildren<{}>) => {
  const { children } = props
  const xzPlaneRef = useRef<Mesh>(null!)

  useSubscribeKey(elementDragEvents, "drag", () => {
    if (elementDragEvents.dragStart === null || elementDragEvents.drag === null)
      return
    const {
      dragStart: {
        point: { x: x0, z: z0 },
        element: { houseId },
      },
      drag: {
        point: { x: x1, z: z1 },
      },
    } = elementDragEvents

    console.log({ x1, z1 })

    // transients.housePosition = {
    //   dx: x1 - x0,
    //   dy: 0,
    //   dz: z1 - z0,
    //   houseId,
    // }
  })

  const bindHandles: any = useGesture({})

  return (
    <Fragment>
      {/* <group {...bindElements()}>{children}</group> */}
      <XZPlane ref={xzPlaneRef} />
      <group {...bindHandles()}>{}</group>
    </Fragment>
  )
}

export default R3FEventsGroup
