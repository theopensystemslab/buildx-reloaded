import { ThreeEvent, useThree } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { identity, pipe } from "fp-ts/lib/function"
import { Fragment, Suspense, useRef } from "react"
import { Mesh } from "three"
import elementDragEvents, {
  useElementDragFunctions,
} from "../../hooks/dragEvents"
import houses, { useHouseKeys } from "../../hooks/houses"
import { useSiteCtx } from "../../hooks/siteCtx"
import { updateTransientHousePositionDelta } from "../../hooks/transients"
import { RA, RR } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import DefaultHouse from "./DefaultHouse"

const DefaultApp = () => {
  const houseKeys = useHouseKeys()

  const xzPlaneRef = useRef<Mesh>(null!)

  const raycaster = useThree((t) => t.raycaster)

  const { buildingHouseId: buildingId } = useSiteCtx()

  // useEvents()

  const { onDragStart, onDragEnd } = useElementDragFunctions()

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
          // object: { userData },
          intersections: [intersection],
        },
      } = state

      // const elementIdentifier = userData.elementIdentifier as ElementIdentifier
      if (first) onDragStart(intersection)
      else if (last) onDragEnd(intersection)
      // else onDrag(intersection)

      // if (first) {
      //   setCameraEnabled(false)
      //   xzPlaneRef.current.position.set(0, point.y, 0)
      //   xzPlaneRef.current.layers.set(RaycasterLayer.ENABLED)
      //   // const [ix] = raycaster.intersectObject(xzPlaneRef.current)
      //   // if (typeof ix === "undefined") return
      //   events.dragStart = {
      //     element: elementIdentifier,
      //     point,
      //   }
      // } else if (last) {
      //   setCameraEnabled(true)
      //   xzPlaneRef.current.layers.set(RaycasterLayer.DISABLED)
      //   xzPlaneRef.current.position.set(0, 0, 0)
      //   events.dragStart = null
      //   events.drag = null
      // } else {
      //   if (events.dragStart === null) return
      //   const [ix] = raycaster.intersectObject(xzPlaneRef.current)
      //   if (typeof ix === "undefined") return

      //   events.drag = {
      //     element: elementIdentifier,
      //     point: ix.point,
      //   }
      // }
    },
  })

  useSubscribeKey(elementDragEvents, "drag", () => {
    if (
      elementDragEvents.dragStart === null ||
      elementDragEvents.drag === null
    ) {
      return
    }

    const {
      dragStart: {
        point: { x: x0, z: z0 },
        element: { houseId },
      },
      drag: {
        point: { x: x1, z: z1 },
      },
    } = elementDragEvents

    updateTransientHousePositionDelta(houseId, {
      dx: x1 - x0,
      dy: 0,
      dz: z1 - z0,
    })
  })

  const bindHandles: any = useGesture({})

  return (
    <Fragment>
      <group {...bindElements()}>
        {pipe(
          RR.keys(houses),
          buildingId ? RA.filter((id) => id === buildingId) : identity,
          RA.map((id) => (
            <Suspense key={id} fallback={null}>
              <DefaultHouse houseId={id} />
            </Suspense>
          ))
        )}
      </group>
      <XZPlane />
      <YPlane />
    </Fragment>
  )
}

export default DefaultApp
