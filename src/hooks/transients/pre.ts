import { proxy } from "valtio"
import { useSubscribeKey } from "../../utils/hooks"
import { collideOBB, useComputeDimensions } from "../dimensions"
import { TransientsProxy } from "./common"
import postTransients from "./post"

const preTransients = proxy<TransientsProxy>({})

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

export default preTransients
