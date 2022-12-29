import { useRef } from "react"
import { OBB } from "three-stdlib"
import { proxy } from "valtio"
import { useSubscribeKey } from "../../utils/hooks"
import { useComputeDimensions, collideOBB } from "../dimensions"
import houses from "../houses"

export type TransformsTransients = {
  position?: DeltaV3
  rotation?: number
}

export type TransientsProxy = Record<string, TransformsTransients>

const pre = proxy<TransientsProxy>({})
const post = proxy<TransientsProxy>({})

const transformsTransients = proxy({
  pre,
  post,
})

export const setTransformsTransients = () => {
  for (let houseId of Object.keys(post)) {
    const { position, rotation } = post[houseId] ?? {}
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
    delete post[houseId]
    delete pre[houseId]
  }
}

export const useSubscribePreTransformsTransients = (houseId: string) => {
  const computeDimensions = useComputeDimensions(houseId)
  const stretchOBB = useRef(new OBB())

  useSubscribeKey(
    pre,
    houseId,
    () => {
      const { obb } = computeDimensions(pre[houseId])
      const collision = collideOBB(obb, [houseId])

      if (collision) return

      post[houseId] = pre[houseId]
    },
    false
  )
}

export default transformsTransients
