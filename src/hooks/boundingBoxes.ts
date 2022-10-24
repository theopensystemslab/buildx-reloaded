import { Box3, Vector3 } from "three"
import { proxy } from "valtio"

const boundingBoxes = proxy<Record<string, Box3>>({})

export const useSetBoundingBox = (houseId: string) => {
  return (
    [x0, y0, z0]: [number, number, number],
    [x1, y1, z1]: [number, number, number]
  ) => {
    const v0 = new Vector3(x0, y0, z0)
    const v1 = new Vector3(x1, y1, z1)
    if (!(houseId in boundingBoxes)) {
      boundingBoxes[houseId] = new Box3(v0, v1)
    } else {
      boundingBoxes[houseId].min = v0
      boundingBoxes[houseId].max = v1
    }
  }
}

export default boundingBoxes
