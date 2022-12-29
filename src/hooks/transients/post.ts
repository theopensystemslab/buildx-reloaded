import { proxy } from "valtio"
import { TransientsProxy } from "./common"

const postTransients = proxy<TransientsProxy>({})

export type HouseTransforms = {
  position: V3
  rotation: number
}

export default postTransients
