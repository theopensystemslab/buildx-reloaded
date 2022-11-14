import { GroupProps, ThreeEvent, useThree } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { Fragment, PropsWithChildren, useRef } from "react"
import { Mesh } from "three"
import { RaycasterLayer } from "../../constants"
import { ElementIdentifier } from "../../data/elements"
import { setCameraEnabled } from "../../hooks/camera"
import events from "../../hooks/events"
import houses from "../../hooks/houses"
import { houseTransforms } from "../../hooks/transforms"
import { useSubscribeKey } from "../../utils/hooks"
import XZPlane from "../XZPlane"

const R3FEventsGroup = (props: PropsWithChildren<GroupProps>) => {
  const xzPlaneRef = useRef<Mesh>(null!)
  const raycaster = useThree((t) => t.raycaster)

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
        xzPlaneRef.current.position.set(0, point.y, 0)
        xzPlaneRef.current.layers.set(RaycasterLayer.ENABLED)
        const [ix] = raycaster.intersectObject(xzPlaneRef.current)
        if (typeof ix === "undefined") return
        events.dragStart = {
          element: elementIdentifier,
          point: ix.point,
        }
      } else if (last) {
        setCameraEnabled(true)
        xzPlaneRef.current.layers.set(RaycasterLayer.DISABLED)
        events.dragStart = null
        if (houseTransforms.position?.houseId === elementIdentifier.houseId) {
          houses[elementIdentifier.houseId].position.x +=
            houseTransforms.position.x
          houses[elementIdentifier.houseId].position.z +=
            houseTransforms.position.z
        }
        houseTransforms.position = null
      } else {
        if (events.dragStart === null) return
        const [ix] = raycaster.intersectObject(xzPlaneRef.current)
        if (typeof ix === "undefined") return
        events.drag = {
          element: elementIdentifier,
          point: ix.point,
        }
      }
    },
  })

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

    houseTransforms.position = {
      x: x1 - x0,
      y: 0,
      z: z1 - z0,
      houseId,
    }
  })

  return (
    <Fragment>
      <group {...props} {...bindElements()} />
      <XZPlane ref={xzPlaneRef} />
    </Fragment>
  )
}

export default R3FEventsGroup
