import { RefObject, useEffect } from "react"
import { Object3D, Vector3 } from "three"
import { proxy, useSnapshot } from "valtio"
import { subscribeKey } from "valtio/utils"
import { ElementIdentifier } from "../data/elements"
import { useSubscribeKey } from "../utils/hooks"
import { PI } from "../utils/math"
import { rotateAboutPoint, useRotateAboutCenter } from "../utils/three"
import dimensions from "./dimensions"
import elementCategories, { useGetElementVisible } from "./elementCategories"
import houses from "./houses"

const yAxis = new Vector3(0, 1, 0)

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
  const rotateAboutCenter = useRotateAboutCenter(houseId)

  const {
    position: { x: cx = 0, y: cy = 0, z: cz = 0 } = {},
    rotation: { x: crx = 0, y: cry = 0, z: crz = 0 } = {},
  } = constants ?? {}

  const go = () => {
    if (!ref.current) return

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

    ref.current.rotation.set(-PI / 2, 0, 0)
    ref.current.position.set(x + cx, y + cy, z + cz)
    rotateAboutCenter(ref.current, rotation, false)
  }

  useEffect(go, [crx, cry, crz, cx, cy, cz, houseId, ref, rotateAboutCenter])
  useSubscribeKey(houses[houseId], "position", go)
  useSubscribeKey(houses[houseId], "rotation", go)
  useSubscribeKey(transients, houseId, go)
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
  const computeHousePosition = () => {
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
    let [x, y, z] = computeHousePosition()
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
    const [x, y, z] = computeHousePosition()
    ref.current?.position.set(x, y, z)
  })

  useSubscribeKey(houses[houseId], "rotation", () => {})

  useSubscribeKey(transients, houseId, () => {
    if (!transients[houseId]) return
    ref.current?.scale.set(1, 1, mirror ? 1 : -1)
    const { position, rotation } = transients[houseId]
    if (position) {
      const [x, y, z] = computeTransientPosition()
      ref.current?.position.set(x, y, z)
    }
    if (rotation) {
    }
  })
}

export const useOldElementTransforms = (
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
  // const getElementVisible = useGetElementVisible(systemId)

  const rotateAboutCenter = useRotateAboutCenter(houseId)

  const go = () => {
    if (!ref.current) return

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
        rotation += deltaRotation // + cry // + dr
      }
    }

    ref.current.position.set(x, y, z)
    // rotateAboutCenter(ref.current, delta)
  }
  // const init = () => {
  //   let {
  //     position: { x: hx, y: hy, z: hz },
  //   } = houses[houseId]

  //   let mirrorFix = mirror ? moduleLength / 2 : -(moduleLength / 2)

  //   let x = hx,
  //     y = hy + levelY,
  //     z = hz + columnZ + moduleZ + mirrorFix

  //   ref.current?.scale.set(1, 1, mirror ? 1 : -1)
  //   ref.current?.position.set(x, y, z)

  //   if (!getElementVisible(elementName)) {
  //     ref.current?.scale.set(0, 0, 0)
  //   }
  // }

  // const go = () => {
  //   if (!ref.current) return

  //   const mirrorFix = mirror ? moduleLength / 2 : -(moduleLength / 2)

  //   let {
  //     position: { x, y: hy, z: hz },
  //     rotation,
  //   } = houses[houseId]

  //   let y = hy + levelY,
  //     z = hz + columnZ + moduleZ + mirrorFix

  //   if (houseId in transients) {
  //     const { position, rotation: deltaRotation } = transients[houseId]

  //     if (position) {
  //       x += position.dx
  //       y += position.dy
  //       z += position.dz
  //     }

  //     if (deltaRotation) {
  //       const {
  //         obb: { center },
  //       } = dimensions[houseId]

  //       // rotateAboutPoint(
  //       //   ref.current,
  //       //   center,
  //       //   mirror ? yAxis : yAxis.negate(),
  //       //   deltaRotation
  //       //   // rotation - ref.current.rotation.y
  //       //   // 0
  //       // )
  //     }
  //   }
  //   ref.current.position.set(x, y, z)
  // }

  // useEffect(init, [
  //   columnZ,
  //   elementName,
  //   getElementVisible,
  //   houseId,
  //   levelY,
  //   mirror,
  //   moduleLength,
  //   moduleZ,
  //   ref,
  // ])
  useEffect(go, [
    columnZ,
    houseId,
    levelY,
    mirror,
    moduleLength,
    moduleZ,
    ref,
    rotateAboutCenter,
  ])

  useSubscribeKey(houses[houseId], "position", go)
  useSubscribeKey(houses[houseId], "rotation", go)
  useSubscribeKey(transients, houseId, go)
}
