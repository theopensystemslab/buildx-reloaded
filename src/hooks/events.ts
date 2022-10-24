import { proxy } from "valtio"

type T = {
  before: {
    newHouseTransform: {
      houseId: string
      positionDelta: V3
      rotation: number
    } | null
  }
}

const events = proxy<T>({
  before: {
    newHouseTransform: null,
  },
})

export default events
