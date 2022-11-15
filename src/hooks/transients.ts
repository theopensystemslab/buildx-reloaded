import { RefObject, useEffect } from "react"
import { Mesh } from "three"
import { proxy, useSnapshot } from "valtio"
import { ElementIdentifier } from "../data/elements"
import { useSubscribeKey } from "../utils/hooks"
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

export const useElementTransforms = (
  ref: RefObject<Mesh>,
  {
    elementIdentifier: { houseId },
    columnZ,
    levelY,
    moduleZ,
    moduleLength,
    mirror,
  }: {
    elementIdentifier: ElementIdentifier
    columnZ: number
    levelY: number
    moduleZ: number
    moduleLength: number
    mirror: boolean
  }
) => {
  const init = () => {
    ref.current?.scale.set(1, 1, mirror ? 1 : -1)
  }

  const go = () => {
    const mirrorFix = mirror ? moduleLength / 2 : -(moduleLength / 2)
    let x = 0,
      y = levelY,
      z = columnZ + moduleZ + mirrorFix

    ref.current?.position.set(x, y, z)
  }

  useEffect(init, [mirror, ref])

  useSubscribeKey(houses[houseId], "position", go)
  useSubscribeKey(houses[houseId], "rotation", go)
  useSubscribeKey(transients, "housePosition", go)
  useSubscribeKey(transients, "houseRotation", go)

  useEffect(go, [columnZ, levelY, mirror, moduleLength, moduleZ, ref])
  // const hardZ = columnZ + moduleZ +
}
