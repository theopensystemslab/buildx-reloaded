import { proxy } from "valtio"
import { useSubscribeKey } from "../../utils/hooks"
import { collideOBB, useComputeDimensions } from "../dimensions"
import houses from "../houses"
import { stretchLength } from "./stretch"

export type Transients = {
  position?: DeltaV3
  rotation?: number
}

export type TransientsProxy = Record<string, Transients>

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
