import { useCallback } from "react"
import { proxy } from "valtio"
import { useSubscribeKey } from "../../utils/hooks"
import { useHouse } from "../houses"
import { TransientsProxy } from "./common"

const postTransients = proxy<TransientsProxy>({})

export type HouseTransforms = {
  position: V3
  rotation: number
}

export const usePostTransientHouseTransforms = (
  houseId: string,
  f: (t: HouseTransforms) => void
) => {
  const { position: housePosition, rotation: houseRotation } = useHouse(houseId)

  const cb = useCallback(() => {
    const { x: hx, y: hy, z: hz } = housePosition
    const hr = houseRotation

    const {
      position: { dx, dy, dz } = { dx: 0, dy: 0, dz: 0 },
      rotation: dr = 0,
    } = postTransients[houseId] ?? {
      position: { dx: 0, dy: 0, dz: 0 },
      rotation: 0,
    }

    const payload: HouseTransforms = {
      position: {
        x: hx + dx,
        y: hy + dy,
        z: hz + dz,
      },
      rotation: hr + dr,
    }

    f(payload)
  }, [f, houseId, housePosition, houseRotation])

  useSubscribeKey(postTransients, houseId, cb)
}

export default postTransients
