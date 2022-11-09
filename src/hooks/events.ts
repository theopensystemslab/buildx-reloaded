import { useEffect, useRef } from "react"
import { Matrix4 } from "three"
import { proxy } from "valtio"
import { subscribeKey } from "valtio/utils"
import { addV3 } from "../utils/math"
import dimensions from "./dimensions"
import houses from "./houses"

type NewHouseTransform = {
  houseId: string
  positionDelta: V3
  rotation: number
}

type NewStretch = {}

type T = {
  before: {
    newHouseTransform: NewHouseTransform | null
    newStretch: NewStretch | null
  }
  after: {
    newHouseTransform: NewHouseTransform | null
    newStretch: NewStretch | null
  }
}

const events = proxy<T>({
  before: {
    newHouseTransform: null,
    newStretch: null,
  },
  after: {
    newHouseTransform: null,
    newStretch: null,
  },
})

export const useHouseTransformCollisionDetection = () => {
  const m4 = useRef(new Matrix4())

  useEffect(
    () =>
      subscribeKey(events.before, "newHouseTransform", () => {
        if (events.before.newHouseTransform === null) return
        const { houseId, positionDelta, rotation } =
          events.before.newHouseTransform

        const [dx, dy, dz] = positionDelta

        const thisObb = dimensions[houseId].obb

        m4.current.makeRotationY(rotation)
        m4.current.makeTranslation(dx, dy, dz)

        thisObb.applyMatrix4(m4.current)

        // try new dimensions

        let allowed = true

        for (let [k, { obb }] of Object.entries(dimensions)) {
          if (k === houseId) continue
          const intersects = obb.intersectsOBB(thisObb)
          if (intersects) {
            allowed = false
            break
          }
        }

        // reset dimensions if not working
        if (!allowed) {
          m4.current.invert()
          thisObb.applyMatrix4(m4.current)
          return
        }

        if (positionDelta)
          houses[houseId].position = addV3(
            houses[houseId].position,
            positionDelta
          )
        if (rotation) houses[houseId].rotation = rotation

        events.after.newHouseTransform = events.before.newHouseTransform
      }),
    []
  )
}
export default events
