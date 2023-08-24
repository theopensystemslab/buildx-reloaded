import { useEvent } from "react-use"
import { Object3D } from "three"
import { z } from "zod"

export const GestureEventType = z.enum(["POINTER_DOWN", "POINTER_UP"])

export type GestureEventType = z.infer<typeof GestureEventType>

export type GestureEventDetail = {
  point: V3
  object: Object3D
}

export const usePointerDownListener = (
  f: (eventDetail: GestureEventDetail) => void
) => useEvent(GestureEventType.Enum.POINTER_DOWN, ({ detail }) => f(detail))

export const dispatchPointerDown = (detail: GestureEventDetail) =>
  dispatchEvent(new CustomEvent(GestureEventType.Enum.POINTER_DOWN, { detail }))

export const usePointerUpListener = (f: () => void) =>
  useEvent(GestureEventType.Enum.POINTER_UP, () => f())

export const dispatchPointerUp = () =>
  dispatchEvent(new CustomEvent(GestureEventType.Enum.POINTER_UP))
