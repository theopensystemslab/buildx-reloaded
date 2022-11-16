import { RefObject, useEffect } from "react"
import { Object3D } from "three"
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
    stretchUnits?: number
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

export const useStretchHandleTransform = (
  ref: RefObject<Object3D>,
  houseId: string,
  constants?: {
    position?: Partial<DeltaV3>
    rotation?: Partial<DeltaV3>
  }
) => {
  const {
    position: { dx: cx = 0, dy: cy = 0, dz: cz = 0 } = {},
    rotation: { dx: crx = 0, dy: cry = 0, dz: crz = 0 } = {},
  } = constants ?? {}

  const go = () => {
    let {
      position: { x, y, z },
      rotation,
    } = houses[houseId]

    if (houseId in transients) {
      const { position, rotation: deltaRotation } = transients[houseId]

      if (position) {
        x += position.dx
        y += position.dy
        z += position.dz
      }

      if (deltaRotation) {
        rotation += deltaRotation + cry // + dr
      }
    }

    ref.current?.rotation.set(crx, rotation, crz)
    ref.current?.position.set(x + cx, y + cy, z + cz)
  }

  useEffect(go, [crx, cry, crz, cx, cy, cz, houseId, ref])
  useSubscribeKey(houses[houseId], "position", go)
  useSubscribeKey(houses[houseId], "rotation", go)
  useSubscribeKey(transients, houseId, go)
}

export const useHouseTransforms = (
  ref: RefObject<Object3D>,
  houseId: string,
  constants?: {
    position?: Partial<V3>
    rotation?: Partial<V3>
  }
) => {
  const {
    position: { x: cx = 0, y: cy = 0, z: cz = 0 } = {},
    rotation: { x: crx = 0, y: cry = 0, z: crz = 0 } = {},
  } = constants ?? {}

  const go = () => {
    let {
      position: { x, y, z },
      rotation,
    } = houses[houseId]

    if (houseId in transients) {
      const { position, rotation: deltaRotation } = transients[houseId]

      if (position) {
        x += position.dx
        y += position.dy
        z += position.dz
      }

      if (deltaRotation) {
        rotation += deltaRotation + cry // + dr
      }
    }

    ref.current?.rotation.set(crx, rotation, crz)
    ref.current?.position.set(x + cx, y + cy, z + cz)
  }

  useEffect(go, [crx, cry, crz, cx, cy, cz, houseId, ref])
  useSubscribeKey(houses[houseId], "position", go)
  useSubscribeKey(houses[houseId], "rotation", go)
  useSubscribeKey(transients, houseId, go)
}

export const useElementTransforms = (
  ref: RefObject<Object3D>,
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

    let {
      position: { x, y: hy, z: hz },
      rotation,
    } = houses[houseId]

    let y = hy + levelY,
      z = hz + columnZ + moduleZ + mirrorFix

    if (houseId in transients) {
      const { position, rotation: deltaRotation } = transients[houseId]

      if (position) {
        x += position.dx
        y += position.dy
        z += position.dz
      }

      if (deltaRotation) {
        rotation += deltaRotation
      }
    }
    ref.current?.rotation.set(0, rotation, 0)
    ref.current?.position.set(x, y, z)
  }

  useEffect(init, [mirror, ref])
  useEffect(go, [columnZ, houseId, levelY, mirror, moduleLength, moduleZ, ref])

  useSubscribeKey(houses[houseId], "position", go)
  useSubscribeKey(houses[houseId], "rotation", go)
  useSubscribeKey(transients, houseId, go)
}
