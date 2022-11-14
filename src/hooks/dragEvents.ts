import { ThreeEvent } from "@react-three/fiber"
import { FullGestureState } from "@use-gesture/react"
import { useCallback } from "react"
import { Intersection, Vector3 } from "three"
import { proxy, useSnapshot } from "valtio"
import { ElementIdentifier } from "../data/elements"
import { setCameraEnabled } from "./camera"
import { SiteCtxModeEnum, useSiteCtx, useSiteCtxMode } from "./siteCtx"
import { setHousePosition, transients } from "./transients"

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

export const useElementDragFunctions = () => {
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

  // const onDrag = useCallback(
  //   ({ object: { userData }, point }: Intersection) => {
  //     switch (siteCtxMode) {
  //       case SiteCtxModeEnum.Enum.SITE:
  //         elementDragEvents.drag = {
  //           element: userData as ElementIdentifier,
  //           point,
  //         }
  //         return
  //       case SiteCtxModeEnum.Enum.BUILDING:
  //         return
  //       case SiteCtxModeEnum.Enum.LEVEL:
  //         return
  //     }
  //   },
  //   [siteCtxMode]
  // )

  const onDragEnd = useCallback(
    (intersection: Intersection) => {
      setCameraEnabled(true)
      switch (siteCtxMode) {
        case SiteCtxModeEnum.Enum.SITE:
          elementDragEvents.drag = null
          elementDragEvents.dragStart = null
          elementDragEvents.drop = true
          setHousePosition()
          transients.housePosition = null
          return
        case SiteCtxModeEnum.Enum.BUILDING:
          return
        case SiteCtxModeEnum.Enum.LEVEL:
          return
      }
    },
    [siteCtxMode]
  )

  return { onDragStart, onDragEnd }
}

export default elementDragEvents
