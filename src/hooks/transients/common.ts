import houses from "../houses"
import { stretchLength } from "./stretch"
import { postTransformsTransients, preTransformsTransients } from "./transforms"

export const setTransients = () => {
  for (let houseId of Object.keys(postTransformsTransients)) {
    const { position, rotation } = postTransformsTransients[houseId] ?? {}
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
    delete postTransformsTransients[houseId]
    delete preTransformsTransients[houseId]
  }

  for (let houseId of Object.keys(stretchLength)) {
    delete stretchLength[houseId]
  }
}
