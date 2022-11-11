import { Vector3 } from "three"
import { proxy } from "valtio"
import { ElementIdentifier } from "../data/elements"

type DragEvent = {
  element: ElementIdentifier
  point: Vector3
}

type Events = {
  dragStart: DragEvent | null
  drag: DragEvent | null
}

const events = proxy<Events>({
  drag: null,
  dragStart: null,
})

export default events
