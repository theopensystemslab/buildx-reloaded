import houses from "../houses"
import { stretchLength } from "./stretch"
import { postTransients, preTransients } from "./transforms"

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

  for (let houseId of Object.keys(stretchLength)) {
    delete stretchLength[houseId]
  }
}
