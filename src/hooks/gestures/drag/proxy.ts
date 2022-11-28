import { proxy } from "valtio"
import { ElementIdentifier } from "./elements"
import { HandleIdentifier } from "./handles"

export type Drag = {
  identifier: HandleIdentifier | ElementIdentifier
  point: V3
}

type Drags = {
  start: Drag | null
  drag: Drag | null
  end: boolean
}

const dragProxy = proxy<Drags>({
  start: null,
  drag: null,
  end: true,
})

export default dragProxy
