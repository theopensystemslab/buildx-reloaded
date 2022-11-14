import { Instances } from "@react-three/drei"
import { ThreeEvent, useThree } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { identity, pipe } from "fp-ts/lib/function"
import { Fragment, Suspense, useRef } from "react"
import { Mesh } from "three"
import { RaycasterLayer } from "../../constants"
import { ElementIdentifier } from "../../data/elements"
import { setCameraEnabled } from "../../hooks/camera"
import events from "../../hooks/events"
import houses, { useHouseKeys, useHouses } from "../../hooks/houses"
import { useSiteCtx } from "../../hooks/siteCtx"
import { transients } from "../../hooks/transients"
import HandleMaterial from "../../materials/HandleMaterial"
import { RA, RR } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import XZPlane from "../XZPlane"
import DefaultHouse from "./DefaultHouse"
import RotateHandleInstances from "./RotateHandleInstances"

const DefaultApp = () => {
  const houseKeys = useHouseKeys()

  const xzPlaneRef = useRef<Mesh>(null!)

  const raycaster = useThree((t) => t.raycaster)

  const { buildingHouseId: buildingId } = useSiteCtx()

  // useEvents()

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
        // const [ix] = raycaster.intersectObject(xzPlaneRef.current)
        // if (typeof ix === "undefined") return
        events.dragStart = {
          element: elementIdentifier,
          point,
        }
      } else if (last) {
        setCameraEnabled(true)
        xzPlaneRef.current.layers.set(RaycasterLayer.DISABLED)
        xzPlaneRef.current.position.set(0, 0, 0)
        events.dragStart = null
        if (transients.housePosition?.houseId === elementIdentifier.houseId) {
          houses[elementIdentifier.houseId].position.x +=
            transients.housePosition.x
          houses[elementIdentifier.houseId].position.z +=
            transients.housePosition.z
        }
        transients.housePosition = null
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
      <XZPlane ref={xzPlaneRef} />
      <Instances>
        <circleBufferGeometry args={[0.5, 10]} />
        <HandleMaterial />
        {pipe(
          houseKeys,
          RA.map((houseId) => (
            <RotateHandleInstances key={houseId} houseId={houseId} />
          ))
        )}
      </Instances>
      {/* <group {...bindHandles()}>
        
      </group> */}
    </Fragment>
  )
}

export default DefaultApp
