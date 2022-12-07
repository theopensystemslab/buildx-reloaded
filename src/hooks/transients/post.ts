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
  const cb = () => {
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

    const payload = {
      position: {
        x: hx + dx,
        y: hy + dy,
        z: hz + dz,
      },
      rotation: hr + dr,
    }

    f(payload)
    // f({
    //   position: {
    //     x: 0,
    //     y: 0,
    //     z: 0,
    //   },
    //   rotation: 0,
    // })
  }

  useSubscribeKey(postTransients, houseId, cb)
}

export default postTransients
