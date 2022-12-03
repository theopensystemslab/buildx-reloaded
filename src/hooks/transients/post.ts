import { useCallback } from "react"
import { proxy } from "valtio"
import { useSubscribeKey } from "../../utils/hooks"
import houses from "../houses"
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
  const cb = useCallback(() => {
    const {
      position: { x: hx, y: hy, z: hz },
      rotation: hr,
    } = houses[houseId]
    const {
      position: { dx, dy, dz } = { dx: 0, dy: 0, dz: 0 },
      rotation: dr = 0,
    } = postTransients[houseId] ?? {
      position: { dx: 0, dy: 0, dz: 0 },
      rotation: 0,
    }

    f({
      position: {
        x: hx + dx,
        y: hy + dy,
        z: hz + dz,
      },
      rotation: hr + dr,
    })
  }, [f, houseId])

  useSubscribeKey(postTransients, houseId, cb)
}

export default postTransients
