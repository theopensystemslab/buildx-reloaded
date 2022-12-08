import { HandleSide } from "../gestures/drag/handles"
import houses from "../houses"
import { EditMode } from "../siteCtx"
import postTransients from "./post"
import preTransients from "./pre"

export type Transients = {
  position?: DeltaV3
  rotation?: number
  stretch?: {
    editMode: EditMode
    side: HandleSide
    dx: number
    dz: number
  }
}

export type TransientsProxy = Record<string, Transients>

export const setTransients = () => {
  for (let houseId of Object.keys(postTransients)) {
    const { position, rotation } = postTransients[houseId] ?? {}
    if (position) {
      const { x, y, z } = houses[houseId].position
      const { dx, dy, dz } = position
      houses[houseId].position = {
        x: x + dx,
        y: y + dy,
        z: z + dz,
      }
    }
    if (rotation) {
      houses[houseId].rotation += rotation
    }
    delete postTransients[houseId]
    delete preTransients[houseId]
  }
}
