import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { setCameraEnabled } from "../hooks/camera"

export const useObjectDragHandlers = (): any => {
  return useGesture<{ drag: ThreeEvent<PointerEvent> }>({
    onDrag: ({ first, last }) => {
      if (first) {
        setCameraEnabled(false)
      }
      if (last) {
        setCameraEnabled(true)
      }
    },
  })
}

export const useHandleDragHandlers = (): any => {
  return useGesture<{ drag: ThreeEvent<PointerEvent> }>({
    onDrag: ({ first, last }) => {
      if (first) {
        setCameraEnabled(false)
      }
      if (last) {
        setCameraEnabled(true)
      }
    },
  })
}
