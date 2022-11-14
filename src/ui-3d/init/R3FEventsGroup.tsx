import { ThreeEvent, useThree } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { Fragment, PropsWithChildren, useRef } from "react"
import { Mesh } from "three"
import { RaycasterLayer } from "../../constants"
import { ElementIdentifier } from "../../data/elements"
import { setCameraEnabled } from "../../hooks/camera"
import events from "../../hooks/events"
import houses from "../../hooks/houses"
import { transients } from "../../hooks/transients"
import { useSubscribeKey } from "../../utils/hooks"
import XZPlane from "../XZPlane"

const R3FEventsGroup = (props: PropsWithChildren<{}>) => {
  const { children } = props
  const xzPlaneRef = useRef<Mesh>(null!)

  useSubscribeKey(events, "drag", () => {
    if (events.dragStart === null || events.drag === null) return
    const {
      dragStart: {
        point: { x: x0, z: z0 },
        element: { houseId },
      },
      drag: {
        point: { x: x1, z: z1 },
      },
    } = events

    console.log({ x1, z1 })

    transients.housePosition = {
      x: x1 - x0,
      y: 0,
      z: z1 - z0,
      houseId,
    }
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
