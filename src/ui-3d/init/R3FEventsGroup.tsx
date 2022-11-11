import { GroupProps, ThreeEvent } from "@react-three/fiber"
import { Handler, useGesture } from "@use-gesture/react"
import { Fragment, PropsWithChildren, useEffect, useRef } from "react"
import { Mesh, Vector3 } from "three"
import { subscribe } from "valtio"
import { subscribeKey } from "valtio/utils"
import { RaycasterLayer } from "../../constants"
import { ElementIdentifier } from "../../data/elements"
import { setCameraEnabled } from "../../hooks/camera"
import events from "../../hooks/events"
import houses from "../../hooks/houses"
import { useSubscribeKey } from "../../utils/hooks"
import XZPlane from "../XZPlane"

const R3FEventsGroup = (props: PropsWithChildren<GroupProps>) => {
  const xzPlaneRef = useRef<Mesh>(null!)

  const bindElements: any = useGesture<{
    hover: ThreeEvent<PointerEvent>
    drag: ThreeEvent<PointerEvent>
    onPointerDown: ThreeEvent<PointerEvent>
  }>({
    onDrag: (state) => {
      const {
        first,
        last,
        event: {
          object: { userData },
          intersections: [{ point }],
        },
      } = state

      const elementIdentifier = userData.elementIdentifier as ElementIdentifier

      if (first) {
        setCameraEnabled(false)
        const [x, y, z] = point.toArray()
        xzPlaneRef.current.position.set(x, y, z)
        xzPlaneRef.current.layers.set(RaycasterLayer.ENABLED)
        events.dragStart = {
          element: elementIdentifier,
          point,
        }
      } else if (last) {
        setCameraEnabled(true)
        xzPlaneRef.current.layers.set(RaycasterLayer.DISABLED)
      } else {
        events.drag = {
          element: elementIdentifier,
          point,
        }
      }
    },
  })

  useSubscribeKey(events, "drag", () => {
    if (events.drag === null) return
    const {
      element: { houseId },
      point: { x, y, z },
    } = events.drag
    houses[houseId].position[0] = x
    houses[houseId].position[2] = z
  })

  // useEffect(() => {
  //   return subscribeKey(events, "hover", () => {
  //     // console.log(events.hover)
  //   })
  // })

  return (
    <Fragment>
      <group {...props} {...bindElements()} />
      <XZPlane ref={xzPlaneRef} />
    </Fragment>
  )
}

export default R3FEventsGroup
