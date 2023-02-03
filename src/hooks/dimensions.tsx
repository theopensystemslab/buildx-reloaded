import { useThree } from "@react-three/fiber"
import { useCallback, useRef } from "react"
import { BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, Vector3 } from "three"
import { OBB } from "three-stdlib"
import { proxy, ref, useSnapshot } from "valtio"
import { useSubscribeKey } from "../utils/hooks"
import { yAxis } from "../utils/three"
import houses from "./houses"
import { layouts } from "./layouts"
import { postTransformsTransients, Transforms } from "./transients/transforms"

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

export const useRenderOBB = () => {
  const scene = useThree((t) => t.scene)

  return (obb: OBB, matrix?: Matrix4) => {
    const size = obb.halfSize.multiplyScalar(2)
    const geom = new BoxGeometry(size.x, size.y, size.z)
    const material = new MeshBasicMaterial({ color: "tomato" })
    const mesh = new Mesh(geom, material)
    if (matrix) mesh.applyMatrix4(matrix)
    scene.add(mesh)
  }
}

export const usePostTransMatrix = (houseId: string) => {
  const translationMatrix = useRef(new Matrix4())
  const rotationMatrix = useRef(new Matrix4())

  return (deltas?: { x?: number; y?: number; z?: number }) => {
    const {
      position: { dx, dy, dz } = { dx: 0, dy: 0, dz: 0 },
      rotation: dr = 0,
    } = postTransformsTransients[houseId] ?? {}

    const {
      position: { x, y, z },
      rotation,
    } = houses[houseId]

    const { x: ddx = 0, y: ddy = 0, z: ddz = 0 } = deltas ?? {}

    rotationMatrix.current.makeRotationY(rotation + dr)

    const v = new Vector3(dx + ddx, dy + ddy, dz + ddz)
    v.applyAxisAngle(yAxis, rotation)

    v.add(new Vector3(x, y, z))
    translationMatrix.current.identity()
    translationMatrix.current.setPosition(v)

    return translationMatrix.current.multiply(rotationMatrix.current)
  }
}

export const useComputeDimensions = (houseId: string) => {
  const translationMatrix = useRef(new Matrix4())
  const rotationMatrix = useRef(new Matrix4())

  return (transients: Transforms = {}): Dimensions => {
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
    const z0 = columns[0].gridGroups[0].modules[0].z
    const lastColumn = columns[columns.length - 1]
    const lastGridGroup =
      lastColumn.gridGroups[lastColumn.gridGroups.length - 1]
    const lastModule = lastGridGroup.modules[lastGridGroup.modules.length - 1]
    const z1 = lastColumn.z + lastModule.z + lastModule.module.length

    const length = z1 - z0

    const { x: px, y: py, z: pz } = houses[houseId].position

    const halfSize = new Vector3(width / 2, height / 2, length / 2)
    const center = new Vector3(0, 0, 0)
    const obb = new OBB(center, halfSize)

    rotationMatrix.current.makeRotationY(houses[houseId].rotation + dr)
    translationMatrix.current.makeTranslation(
      px + dx,
      py + dy + height / 2,
      pz + dz
    )

    obb.applyMatrix4(translationMatrix.current.multiply(rotationMatrix.current))

    return {
      width,
      height,
      length,
      obb,
    }
  }
}

export const useHouseDimensionsUpdates = (houseId: string) => {
  const computeDimensions = useComputeDimensions(houseId)

  const updateDimensions = useCallback(() => {
    const { width, length, height, obb } = computeDimensions()

    dimensions[houseId] = {
      width,
      length,
      height,
      obb: ref(obb),
    }
  }, [computeDimensions, houseId])

  useSubscribeKey(houses[houseId], "position", updateDimensions)
  useSubscribeKey(houses[houseId], "rotation", updateDimensions)
  useSubscribeKey(layouts, houseId, updateDimensions)

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
