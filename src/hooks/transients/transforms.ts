import { proxy } from "valtio"
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
