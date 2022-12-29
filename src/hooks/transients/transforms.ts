import { proxy } from "valtio"
import { useSubscribeKey } from "../../utils/hooks"
import { collideOBB, useComputeDimensions } from "../dimensions"
import houses from "../houses"
import { Stretch } from "./stretch"

export type Transients = {
  position?: DeltaV3
  rotation?: number
  stretch?: Stretch
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

export const preTransients = proxy<TransientsProxy>({})

export const usePreTransient = (houseId: string) => {
  const computeDimensions = useComputeDimensions(houseId)

  useSubscribeKey(
    preTransients,
    houseId,
    () => {
      const { obb } = computeDimensions(preTransients[houseId])
      const collision = collideOBB(obb, [houseId])

      if (collision) return

      postTransients[houseId] = preTransients[houseId]
    },
    false
  )
}

export const postTransients = proxy<TransientsProxy>({})

export type HouseTransforms = {
  position: V3
  rotation: number
}
