import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useSnapshot } from "valtio"
import { useSubscribeKey } from "../../utils/hooks"
import { setCameraEnabled } from "../camera"
import globals from "../globals"
import dragProxy, { Drag } from "./drag/proxy"

export const useDragHandler = () => {
  useSubscribeKey(dragProxy, "drag", () => {
    if (dragProxy.drag === null) return
    const { identifier, point } = dragProxy.drag
    switch (identifier.identifierType) {
      case "element":
      case "handle":
    }
  })
}

export const useGestures = (): any => {
  useDragHandler()

  return useGesture<{ drag: ThreeEvent<PointerEvent> }>({
    onDrag: ({
      first,
      last,
      event: {
        intersections: [
          {
            object: { userData },
            point: intersectionPoint,
          },
        ],
      },
    }) => {
      const [x, z] = globals.pointerXZ
      const y = globals.pointerY

      const drag: Drag = {
        identifier: userData.identifier,
        point: { x, y, z },
      }

      if (first) {
        setCameraEnabled(false)
        // XZ and Y planes should subscribe here to jump to right place
        dragProxy.start = {
          identifier: userData.identifier,
          point: intersectionPoint,
        }
        dragProxy.end = false
      } else if (last) {
        dragProxy.end = true
        setCameraEnabled(true)
      } else {
        dragProxy.drag = drag
      }
    },
  })
}

export const useDragStart = () => {
  const { start } = useSnapshot(dragProxy)

  return start
}
