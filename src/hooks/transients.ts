import { proxy, useSnapshot } from "valtio"

export type Transients = {
  housePosition: {
    houseId: string
    x: number
    y: number
    z: number
  } | null
  houseRotation: {
    houseId: string
    y: number
  } | null
  // houseId: string
  // rotationY: number
  // position: {
  //   x: number
  //   y: number
  //   z: number
  // }
}

export const transients = proxy<Transients>({
  housePosition: null,
  houseRotation: null,
})

export const useTransients = () => useSnapshot(transients)
