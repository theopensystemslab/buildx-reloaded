import { RefObject, useCallback, useEffect, useRef } from "react"
import { Matrix4, Object3D, Vector3 } from "three"
import { OBB } from "three-stdlib"
import { proxy, ref, useSnapshot } from "valtio"
import { useSubscribeKey } from "../utils/hooks"
import { PI } from "../utils/math"
import {
  rotateAboutPoint,
  useRotateAboutCenter,
  useSetRotation,
} from "../utils/three"
import dimensions from "./dimensions"
import { ElementIdentifier } from "./gestures/drag/elements"
import houses from "./houses"
import { layouts } from "./layouts"

const yAxis = new Vector3(0, 1, 0)

export type Transients = {
  position?: DeltaV3
  rotation?: number
  stretchUnits?: number
}

export type TransientsProxy = {
  [houseId: string]: {
    pre?: Transients
    post?: Transients
  }
}

export const transients = proxy<TransientsProxy>({})

export const useTransients = () => useSnapshot(transients)

export const newTransientPosition = (houseId: string, position: DeltaV3) => {
  transients[houseId].pre = {
    position,
  }
}

export const newTransientRotation = (houseId: string, rotation: number) => {
  transients[houseId].pre = {
    rotation,
  }
}

export const setTransients = () => {
  for (let houseId of Object.keys(transients)) {
    const { position, rotation } = transients[houseId].post ?? {}
    if (position) {
      const { x, y, z } = houses[houseId].position
      const { dx, dy, dz } = position
      houses[houseId].position = {
        x: x + dx,
        y: y + dy,
        z: z + dz,
      }
    }
    if (rotation) {
      houses[houseId].rotation += rotation
    }
    delete transients[houseId]
  }
}

// export const useStretchHandleTransform = (
//   ref: RefObject<Object3D>,
//   houseId: string,
//   constants?: {
//     position?: Partial<V3>
//     rotation?: Partial<V3>
//   }
// ) => {
//   const {
//     position: { x: cx = 0, y: cy = 0, z: cz = 0 } = {},
//     rotation: { x: crx = 0, y: cry = 0, z: crz = 0 } = {},
//   } = constants ?? {}

//   const go = () => {
//     let {
//       position: { x, y, z },
//       rotation,
//     } = houses[houseId]

//     if (houseId in transients) {
//       const { position, rotation: dr } = transients[houseId]

//       if (position) {
//         x += position.dx
//         y += position.dy
//         z += position.dz
//       }

//       if (dr) {
//         rotation += dr + cry // + dr
//       }
//     }

//     // ++ stretch units...

//     ref.current?.rotation.set(crx, rotation, crz)
//     ref.current?.position.set(x + cx, y + cy, z + cz)
//   }

//   useEffect(go, [crx, cry, crz, cx, cy, cz, houseId, ref])
//   useSubscribeKey(houses[houseId], "position", go)
//   useSubscribeKey(houses[houseId], "rotation", go)
//   useSubscribeKey(transients, houseId, go)
// }

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

    // const { position, rotation } = transients[houseId] ?? {}

    // if (position) {
    //   const [x, y, z] = computeTransientPosition()
    //   ref.current?.position.set(x, y, z)
    // }

    // if (rotation) {
    // ref.current.rotation.set(crx, houses[houseId].rotation, crz)
    // rotateAboutCenter(ref.current, houses[houseId].rotation + rotation, false)
    // }
  })
}

export const useElementTransforms = (
  ref: RefObject<Object3D>,
  {
    identifier: { houseId },
    columnZ,
    levelY,
    moduleZ,
    moduleLength,
    mirror,
  }: {
    identifier: ElementIdentifier
    columnZ: number
    levelY: number
    moduleZ: number
    moduleLength: number
    mirror: boolean
  }
) => {
  const setRotation = useSetRotation(houseId)

  const compute = useCallback(() => {
    if (!ref.current) return
    ref.current.scale.set(1, 1, mirror ? 1 : -1)

    let {
      position: { x: hx, y: hy, z: hz },
    } = houses[houseId]

    let mirrorFix = mirror ? moduleLength / 2 : -(moduleLength / 2)

    let x = hx,
      y = hy + levelY,
      z = hz + columnZ + moduleZ + mirrorFix

    if (transients[houseId]) {
      // const {
      //   position: { dx, dy, dz } = { dx: 0, dy: 0, dz: 0 },
      //   rotation = 0,
      // } = transients[houseId]
      // ref.current.position.set(x + dx, y + dy, z + dz)
      // setRotation(ref.current, houses[houseId].rotation + rotation)
    } else {
      ref.current.position.set(x, y, z)
      setRotation(ref.current, houses[houseId].rotation)
    }
  }, [
    columnZ,
    houseId,
    levelY,
    mirror,
    moduleLength,
    moduleZ,
    ref,
    setRotation,
  ])

  useSubscribeKey(houses[houseId], "position", compute, false)
  useSubscribeKey(houses[houseId], "rotation", compute, false)
  useSubscribeKey(transients, houseId, compute, false)
  useSubscribeKey(dimensions, houseId, compute, false)
}

export const useComputeTransientOBB = (houseId: string) => {
  const preTransM = useRef(new Matrix4())
  const postTransM = useRef(new Matrix4())
  const rotationMatrix = useRef(new Matrix4())

  return () => {
    const columns = layouts[houseId]

    if (columns.length < 1) return

    const width = columns[0].gridGroups[0].modules[0].module.width
    const height = columns[0].gridGroups.reduce(
      (acc, gg) => acc + gg.modules[0].module.height,
      0
    )
    const z0 = columns[0].gridGroups[0].modules[0].z
    const lastColumn = columns[columns.length - 1]
    const lastGridGroup =
      lastColumn.gridGroups[lastColumn.gridGroups.length - 1]
    const lastModule = lastGridGroup.modules[lastGridGroup.modules.length - 1]
    const z1 = lastColumn.z + lastModule.z + lastModule.module.length

    const length = z1 - z0

    const { x: px, y: py, z: pz } = houses[houseId].position

    const center = new Vector3(0, 0, 0)
    const halfSize = new Vector3(width / 2, height / 2, length / 2)
    const obb = new OBB(center, halfSize)

    // const {
    //   position: { dx, dy, dz } = { dx: 0, dy: 0, dz: 0 },
    //   rotation: dr = 0,
    // } = transients?.[houseId] ?? {
    //   position: { dx: 0, dy: 0, dz: 0 },
    //   rotation: 0,
    // }

    // rotationMatrix.current.makeRotationY(houses[houseId].rotation + dr)
    // postTransM.current.makeTranslation(px + dx, py + dy, pz + dz + length / 2)

    obb.applyMatrix4(
      postTransM.current.multiply(
        rotationMatrix.current.multiply(preTransM.current)
      )
    )

    // transients[houseId].obb = ref(obb)
  }
}
