import { proxy } from "valtio"
import { HandleSide } from "../gestures/drag/handles"

export * from "./length"

type Stretch = {
  side: HandleSide
  dx: number
  dz: number
  distance: number
}

const stretchProxy = proxy<Record<string, Stretch>>({})

export default stretchProxy
