import { RefObject, useEffect } from "react"
import { Object3D, Vector3 } from "three"
import { proxy, useSnapshot } from "valtio"
import { ElementIdentifier } from "../data/elements"
import { useSubscribeKey } from "../utils/hooks"
import { PI } from "../utils/math"
import {
  rotateAboutPoint,
  useRotateAboutCenter,
  useSetRotation,
} from "../utils/three"
import dimensions from "./dimensions"
import houses from "./houses"

const yAxis = new Vector3(0, 1, 0)

export type Transients = {
  [houseId: string]: {
    position?: {
      dx: number
      dy: number
      dz: number
    }
    rotation?: {
      total: number
      delta: number
    }
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
    const { position, rotation } = transients[houseId]
    if (position) {
      const { x, y, z } = houses[houseId].position
      const { dx, dy, dz } = position
      houses[houseId].position = {
        x: x + dx,
        y: y + dy,
        z: z + dz,
      }
      delete transients[houseId].position
    }
    if (rotation) {
      houses[houseId].rotation += rotation.total
      delete transients[houseId].rotation
    }
  }
}

export const useStretchHandleTransform = (
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
      const {
        position,
        rotation: { total: totalTransientRotation } = { total: 0 },
      } = transients[houseId]

      if (position) {
        x += position.dx
        y += position.dy
        z += position.dz
      }

      if (totalTransientRotation) {
        rotation += totalTransientRotation + cry // + dr
      }
    }

    // ++ stretch units...

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

  // const rotateAboutCenter = useRotateAboutCenter(houseId)

  useSubscribeKey(houses[houseId], "position", () => {
    if (!ref.current) return
    console.log("house transforms sub")
    const { x, y, z } = houses[houseId].position
    ref.current.position.set(x + cx, y + cy, z + cz)
  })

  useSubscribeKey(houses[houseId], "rotation", () => {
    if (!ref.current) return
    ref.current.rotation.set(crx, cry, crz)
    // rotateAboutCenter(ref.current, houses[houseId].rotation)
  })

  useSubscribeKey(transients, houseId, () => {
    if (!ref.current || !transients[houseId]) return
    // ref.current?.scale.set(1, 1, mirror ? 1 : -1)
    const { position, rotation } = transients[houseId]
    // if (position) {
    //   const [x, y, z] = computeTransientPosition()
    //   ref.current?.position.set(x, y, z)
    // }
    if (rotation) {
      // ref.current.rotation.set(crx, houses[houseId].rotation, crz)
      // rotateAboutCenter(ref.current, houses[houseId].rotation + rotation, false)
    }
  })
}

export const useElementTransforms = (
  ref: RefObject<Object3D>,
  {
    elementIdentifier: { systemId, houseId, elementName },
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
  // const rotateAboutCenter = useRotateAboutCenter(houseId)
  const setRotation = useSetRotation(houseId)

  const computeHardPosition = () => {
    let {
      position: { x: hx, y: hy, z: hz },
    } = houses[houseId]

    let mirrorFix = mirror ? moduleLength / 2 : -(moduleLength / 2)

    let x = hx,
      y = hy + levelY,
      z = hz + columnZ + moduleZ + mirrorFix

    return [x, y, z]
  }

  const computeTransientPosition = () => {
    let [x, y, z] = computeHardPosition()
    if (houseId in transients) {
      const { position, rotation: deltaRotation } = transients[houseId]

      if (position) {
        x += position.dx
        y += position.dy
        z += position.dz
      }
    }
    return [x, y, z]
  }

  useSubscribeKey(houses[houseId], "position", () => {
    ref.current?.scale.set(1, 1, mirror ? 1 : -1)
    const [x, y, z] = computeHardPosition()
    ref.current?.position.set(x, y, z)
  })

  useSubscribeKey(houses[houseId], "rotation", () => {
    if (!ref.current) return
    ref.current.scale.set(1, 1, mirror ? 1 : -1)
    const [x, y, z] = computeHardPosition()
    ref.current.position.set(x, y, z)
    setRotation(ref.current, houses[houseId].rotation)
  })

  // let notSwitched = true

  useSubscribeKey(transients, houseId, () => {
    if (!transients[houseId] || !ref.current) return
    ref.current?.scale.set(1, 1, mirror ? 1 : -1)
    const { position, rotation } = transients[houseId]
    if (position) {
      const [x, y, z] = computeTransientPosition()
      ref.current.position.set(x, y, z)
    }
    if (rotation) {
      const [x, y, z] = computeTransientPosition()
      ref.current.position.set(x, y, z)
      setRotation(
        ref.current,
        houses[houseId].rotation + (transients?.[houseId].rotation?.total ?? 0)
      )
    }
  })
}
