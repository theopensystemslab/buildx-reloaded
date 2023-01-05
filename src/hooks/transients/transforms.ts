import { proxy } from "valtio"
import houses from "../houses"
import { useSubscribeKey } from "../../utils/hooks"
import { collideOBB, useComputeDimensions } from "../dimensions"

export type Transforms = {
  position?: DeltaV3
  rotation?: number
}

export type TransformsTransients = Record<string, Transforms>

export const preTransformsTransients = proxy<TransformsTransients>({})

export const usePreTransient = (houseId: string) => {
  const computeDimensions = useComputeDimensions(houseId)

  useSubscribeKey(
    preTransformsTransients,
    houseId,
    () => {
      const { obb } = computeDimensions(preTransformsTransients[houseId])
      const collision = collideOBB(obb, [houseId])

      if (collision) return

      postTransformsTransients[houseId] = preTransformsTransients[houseId]
    },
    false
  )
}

export const postTransformsTransients = proxy<TransformsTransients>({})

export const setTransforms = () => {
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
}
