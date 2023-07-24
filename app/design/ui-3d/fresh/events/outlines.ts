import { useEvent } from "react-use"
import { Object3D, Plane } from "three"

const OUTLINE_EVENT = "OutlineEvent"

type OutlineEventDetail = {
  objects: Object3D[]
  clippingPlanes: Plane[]
}

export const dispatchOutline = (detail: OutlineEventDetail) =>
  dispatchEvent(new CustomEvent(OUTLINE_EVENT, { detail }))

export const useOutlineEvent = (f: (eventDetail: OutlineEventDetail) => void) =>
  useEvent(OUTLINE_EVENT, ({ detail }) => f(detail))
