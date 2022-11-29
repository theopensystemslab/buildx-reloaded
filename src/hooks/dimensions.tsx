import { useCallback, useEffect, useRef } from "react"
import { Matrix4, Mesh, Vector3 } from "three"
import { OBB } from "three-stdlib"
import { proxy, ref, useSnapshot } from "valtio"
import { subscribeKey } from "valtio/utils"
import { useSubscribeKey } from "../utils/hooks"
import houses from "./houses"
import { layouts, useColumnLayout } from "./layouts"

type Dimensions = {
  obb: OBB
  width: number
  height: number
  length: number
}

const dimensions = proxy<Record<string, Dimensions>>({})

export const useUpdateDimensions = (houseId: string) => {
  const preTransM = useRef(new Matrix4())
  const postTransM = useRef(new Matrix4())
  const rotationMatrix = useRef(new Matrix4())

  return useCallback(() => {
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

    rotationMatrix.current.makeRotationY(houses[houseId].rotation)
    postTransM.current.makeTranslation(px, py, pz + length / 2)

    obb.applyMatrix4(
      postTransM.current.multiply(
        rotationMatrix.current.multiply(preTransM.current)
      )
    )
    dimensions[houseId] = {
      width,
      height,
      length,
      obb: ref(obb),
    }
  }, [houseId])
}

export const useHouseDimensionsUpdates = (houseId: string) => {
  const updateDimensions = useUpdateDimensions(houseId)
  useSubscribeKey(houses[houseId], "position", updateDimensions)
  useSubscribeKey(houses[houseId], "rotation", updateDimensions)
}

export const useDimensions = (houseId: string): Dimensions => {
  const snap = useSnapshot(dimensions) as typeof dimensions
  return snap[houseId]
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

export default dimensions
