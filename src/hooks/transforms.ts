import { useRef } from "react"
import { OBB } from "three-stdlib"
import { proxy } from "valtio"
import { useSubscribeKey } from "../utils/hooks"
import { collideOBB, useComputeDimensions } from "./dimensions"
import houses from "./houses"
import { stretchLength } from "./stretch"

export type TransformsTransients = {
  position?: DeltaV3
  rotation?: number
}

export type TransientsProxy = Record<string, TransformsTransients>

export const preTransforms = proxy<TransientsProxy>({})
export const postTransforms = proxy<TransientsProxy>({})

export const setTransients = () => {
  for (let houseId of Object.keys(postTransforms)) {
    const { position, rotation } = postTransforms[houseId] ?? {}
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
    delete postTransforms[houseId]
    delete preTransforms[houseId]
  }

  for (let houseId of Object.keys(stretchLength)) {
    delete stretchLength[houseId]
  }
}

export const useSubscribePreTransformsTransients = (houseId: string) => {
  const computeDimensions = useComputeDimensions(houseId)
  const stretchOBB = useRef(new OBB())

  useSubscribeKey(
    preTransforms,
    houseId,
    () => {
      const { obb } = computeDimensions(preTransforms[houseId])
      const collision = collideOBB(obb, [houseId])

      if (collision) return

      postTransforms[houseId] = preTransforms[houseId]
    },
    false
  )
}
