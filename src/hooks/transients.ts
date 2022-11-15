import { RefObject, useEffect } from "react"
import { Mesh } from "three"
import { proxy, useSnapshot } from "valtio"
import { ElementIdentifier } from "../data/elements"
import { useSubscribeKey } from "../utils/hooks"
import houses from "./houses"

export type Transients = {
  [houseId: string]: {
    position?: {
      dx: number
      dy: number
      dz: number
    }
    rotation?: number
  }
}

export const transients = proxy<Transients>({})

export const useTransients = () => useSnapshot(transients)

export const updateTransientHousePositionDelta = (
  houseId: string,
  position: DeltaV3
) => {
  transients[houseId] = {
    position,
  }
}

export const setTransients = () => {
  for (let houseId of Object.keys(transients)) {
    const { position } = transients[houseId]
    if (position) {
      const { dx, dy, dz } = position
      console.log([dx, dy, dz])
      houses[houseId].position.x += dx
      houses[houseId].position.y += dy
      houses[houseId].position.z += dz
      delete transients[houseId].position
    }
  }
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

    let { x, y: hy, z: hz } = houses[houseId].position

    let y = hy + levelY,
      z = hz + columnZ + moduleZ + mirrorFix

    if (houseId in transients) {
      const { position, rotation } = transients[houseId]

      if (position) {
        x += position.dx
        y += position.dy
        z += position.dz
      }
    }
    ref.current?.position.set(x, y, z)
  }

  useEffect(init, [mirror, ref])

  useSubscribeKey(houses[houseId], "position", go)
  useSubscribeKey(houses[houseId], "rotation", go)
  useSubscribeKey(transients, houseId, go)

  useEffect(go, [columnZ, houseId, levelY, mirror, moduleLength, moduleZ, ref])
}
