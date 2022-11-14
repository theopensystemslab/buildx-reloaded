import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { identity, pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { useDragEvents, useElementDragFunctions } from "../../hooks/dragEvents"
import houses from "../../hooks/houses"
import { useSiteCtx } from "../../hooks/siteCtx"
import { RA, RR } from "../../utils/functions"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import DefaultHouse from "./DefaultHouse"

const DefaultApp = () => {
  const { buildingHouseId: buildingId } = useSiteCtx()

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
          intersections: [intersection],
        },
      } = state

      if (first) onDragStart(intersection)
      else if (last) onDragEnd(intersection)
    },
  })

  useDragEvents()

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
