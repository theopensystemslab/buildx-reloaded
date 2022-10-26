import { proxy } from "valtio"

type NewHouseTransform = {
  houseId: string
  positionDelta: V3
  rotation: number
}

type T = {
  before: {
    newHouseTransform: NewHouseTransform | null
  }
  after: {
    newHouseTransform: NewHouseTransform | null
  }
}

const events = proxy<T>({
  before: {
    newHouseTransform: null,
  },
  after: {
    newHouseTransform: null,
  },
})

export default events
