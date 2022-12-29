import { useCallback, useRef } from "react"
import { Matrix4, Mesh, Vector3 } from "three"
import { OBB } from "three-stdlib"
import { proxy, ref, useSnapshot } from "valtio"
import { useSubscribeKey } from "../utils/hooks"
import houses from "./houses"
import { layouts } from "./layouts"
import { TransformsTransients } from "./transforms"

type Dimensions = {
  obb: OBB
  width: number
  height: number
  length: number
}

const dimensions = proxy<Record<string, Dimensions>>({})

const defaultDimensions: Dimensions = {
  height: 0,
  length: 0,
  width: 0,
  obb: new OBB(),
}

export const useComputeDimensions = (houseId: string) => {
  const preTransM = useRef(new Matrix4())
  const postTransM = useRef(new Matrix4())
  const rotationMatrix = useRef(new Matrix4())

  return useCallback(
    (transients: TransformsTransients = {}): Dimensions => {
      const {
        rotation: dr = 0,
        position: { dx, dy, dz } = { dx: 0, dy: 0, dz: 0 },
      } = transients

      const columns = layouts[houseId]

      const width = columns[0].gridGroups[0].modules[0].module.width
      const height = columns[0].gridGroups.reduce(
        (acc, gg) => acc + gg.modules[0].module.height,
        0
      )

      const { x: px, y: py, z: pz } = houses[houseId].position

      const halfSize = new Vector3(width / 2, height / 2, length / 2)
      const center = new Vector3(0, halfSize.y, halfSize.z)
      const obb = new OBB(center, halfSize)
      // might need offsetting

      rotationMatrix.current.makeRotationY(houses[houseId].rotation + dr)
      postTransM.current.makeTranslation(px + dx, py + dy, pz + dz + length / 2)

      obb.applyMatrix4(
        postTransM.current.multiply(
          rotationMatrix.current.multiply(preTransM.current)
        )
      )

      return {
        width,
        height,
        length,
        obb,
      }
    },
    [houseId]
  )
}

export const useHouseDimensionsUpdates = (houseId: string) => {
  const computeDimensions = useComputeDimensions(houseId)
  const updateDimensions = () => {
    const { width, length, height, obb } = computeDimensions()
    dimensions[houseId] = {
      width,
      length,
      height,
      obb: ref(obb),
    }
  }

  useSubscribeKey(houses[houseId], "position", updateDimensions)
  useSubscribeKey(houses[houseId], "rotation", updateDimensions)

  return computeDimensions()
}

export const useHouseDimensions = (houseId: string): Dimensions => {
  const snap = useSnapshot(dimensions) as typeof dimensions
  return snap[houseId] ?? defaultDimensions
}

export const collideOBB = (obb: OBB, houseIdIgnoreList: string[] = []) => {
  let collision = false

  for (let [k, v] of Object.entries(dimensions)) {
    if (houseIdIgnoreList.includes(k)) continue
    const intersects = v.obb.intersectsOBB(obb)
    if (intersects) {
      collision = true
      break
    }
  }

  return collision
}

export const DebugDimensionsCenterPoint = ({
  houseId,
}: {
  houseId: string
}) => {
  const ref = useRef<Mesh>(null)

  useSubscribeKey(dimensions, houseId, () => {
    if (!dimensions[houseId]) return
    const {
      obb: { center },
    } = dimensions[houseId]
    ref.current?.position.set(...center.toArray())
  })
  return (
    <mesh ref={ref}>
      <sphereBufferGeometry args={[0.25]} />
      <meshBasicMaterial color="tomato" />
    </mesh>
  )
}

export const getHouseCenter = (houseId: string) =>
  dimensions?.[houseId]?.obb?.center ?? new Vector3(0, 0, 0)

export const useHouseCenter = (houseId: string) => {
  const {
    obb: { center },
  } = useHouseDimensions(houseId)
  return center
}

export const useHouseLength = (houseId: string) => {
  const { length } = useHouseDimensions(houseId)
  return length
}

export const useHalfHouseLength = (houseId: string) =>
  useHouseLength(houseId) / 2

export default dimensions
