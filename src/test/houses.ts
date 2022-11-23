import { pipe } from "fp-ts/lib/function"
import { proxy, useSnapshot } from "valtio"
import { R } from "../utils/functions"

export type Transforms = {
  position: V3
  rotation: number
}

const houses = proxy<Record<string, Transforms>>({
  foo: {
    position: {
      x: 0,
      y: 0,
      z: 0,
    },
    rotation: 0,
  },
})

export const useHouseKeys = () => {
  return pipe(useSnapshot(houses) as typeof houses, R.keys)
}

export default houses
