import { proxy } from "valtio"

type PointerProxy = {
  xz: V2
  y: number
}

const pointer = proxy<PointerProxy>({
  xz: [0, 0],
  y: 0,
})

export default pointer
