import { proxy, useSnapshot } from "valtio"
import houses from "./houses"

export type Transients = {
  housePosition: {
    houseId: string
    dx: number
    dy: number
    dz: number
  } | null
  houseRotation: {
    houseId: string
    dy: number
  } | null
}

export const transients = proxy<Transients>({
  housePosition: null,
  houseRotation: null,
})

export const useTransients = () => useSnapshot(transients)

export const updateTransientHousePositionDelta = (
  houseId: string,
  position: DeltaV3
) => {
  transients.housePosition = {
    houseId,
    ...position,
  }
}

export const setHousePosition = () => {
  if (transients.housePosition === null) return
  const { houseId, dx, dy, dz } = transients.housePosition
  houses[houseId].position.x += dx
  houses[houseId].position.y += dy
  houses[houseId].position.z += dz
  transients.housePosition = null
}
