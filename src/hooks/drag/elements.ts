import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useCallback } from "react"
import { Intersection } from "three"
import { proxy, useSnapshot } from "valtio"
import { setCameraEnabled } from "../camera"
import { ElementIdentifier } from "../gestures/drag/elements"
import globals from "../globals"
import { SiteCtxModeEnum, useSiteCtxMode } from "../siteCtx"
import { setTransients } from "../transients"

type ElementDragEvent = {
  element: ElementIdentifier
  point: V3
}

type ElementDragEvents = {
  dragStart: ElementDragEvent | null
  drag: ElementDragEvent | null
  drop: boolean
}

const elementDragEvents = proxy<ElementDragEvents>({
  drag: null,
  dragStart: null,
  drop: true,
})

export const useElementDragStart = () => {
  const { dragStart } = useSnapshot(elementDragEvents)
  return dragStart
}

export const useElementDragEvents = () => useSnapshot(elementDragEvents)

export const useElementDragHandlers = (): any => {
  // useSubscribeKey(elementDragEvents, "drag", () => {
  //   if (
  //     elementDragEvents.dragStart === null ||
  //     elementDragEvents.drag === null
  //   ) {
  //     return
  //   }

  //   const {
  //     dragStart: {
  //       point: { x: x0, z: z0 },
  //       element: { houseId },
  //     },
  //     drag: {
  //       point: { x: x1, z: z1 },
  //     },
  //   } = elementDragEvents

  //   updateTransientHousePositionDelta(houseId, {
  //     dx: x1 - x0,
  //     dy: 0,
  //     dz: z1 - z0,
  //   })
  // })

  // todo ?

  const siteCtxMode = useSiteCtxMode()

  const onDragStart = useCallback(
    ({ object: { userData }, point }: Intersection) => {
      setCameraEnabled(false)
      switch (siteCtxMode) {
        case SiteCtxModeEnum.Enum.SITE:
          elementDragEvents.dragStart = {
            element: userData.elementIdentifier as ElementIdentifier,
            point,
          }
          elementDragEvents.drop = false
          return
        case SiteCtxModeEnum.Enum.BUILDING:
          return
        case SiteCtxModeEnum.Enum.LEVEL:
          return
      }
    },
    [siteCtxMode]
  )

  const onDragEnd = useCallback(
    (_intersection: Intersection) => {
      setCameraEnabled(true)
      switch (siteCtxMode) {
        case SiteCtxModeEnum.Enum.SITE:
          setTransients()
          elementDragEvents.drag = null
          elementDragEvents.dragStart = null
          elementDragEvents.drop = true
          return
        case SiteCtxModeEnum.Enum.BUILDING:
          return
        case SiteCtxModeEnum.Enum.LEVEL:
          return
      }
    },
    [siteCtxMode]
  )

  const onDrag = useCallback(
    ({ object: { userData }, point }: Intersection) => {
      setCameraEnabled(true)
      switch (siteCtxMode) {
        case SiteCtxModeEnum.Enum.SITE:
          const [x, z] = globals.pointerXZ
          elementDragEvents.drag = {
            element: userData.elementIdentifier as ElementIdentifier,
            point: {
              x,
              y: elementDragEvents.dragStart!.point.y,
              z,
            },
          }
          return
        case SiteCtxModeEnum.Enum.BUILDING:
          return
        case SiteCtxModeEnum.Enum.LEVEL:
          return
      }
    },
    [siteCtxMode]
  )

  return useGesture<{
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
      else onDrag(intersection)
    },
  })
}

export default elementDragEvents
