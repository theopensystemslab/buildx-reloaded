import houses from "@/hooks/houses"
import {
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react"
import { Matrix4, Mesh, Vector3 } from "three"
import { subscribeKey } from "valtio/utils"
import { ElementInstanceInput } from "./instances"
import { layouts } from "./layouts"

export const useRotateVector = (buildingId: string | null) => {
  const rotationMatrix = useRef(new Matrix4())

  return ([x0, z0]: [number, number]): [number, number] => {
    const vec = new Vector3(x0, 0, z0)
    rotationMatrix.current.makeRotationY(
      -houses?.[buildingId ?? ""]?.rotation ?? 0
    )
    vec.applyMatrix4(rotationMatrix.current)
    const [x1, , z1] = vec.toArray()
    return [x1, z1]
  }
}

export const useElementInstancePosition = ({
  ref,
  houseId,
  columnIndex,
  levelIndex,
  gridGroupIndex,
  elementName,
}: {
  ref: RefObject<Mesh>
  systemId: string
  houseId: string
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
  elementName: string
}) => {
  const go = useCallback(() => {
    console.log("go")
    const column = layouts[houseId][columnIndex]
    const gridGroup = column.gridGroups[levelIndex]
    const y = gridGroup.y
    const z = column.z + column.gridGroups[levelIndex].modules[gridGroupIndex].z
    const mirror = columnIndex === layouts[houseId].length - 1
    const { length } = gridGroup.modules[gridGroupIndex].module
    const [hx, hy, hz] = houses[houseId].position
    const [tx, ty, tz] = [
      hx,
      hy + y,
      mirror ? hz + z + length / 2 : hz + z - length / 2,
    ]

    if (!ref.current) return

    ref.current.position.set(tx, ty, tz)

    ref.current.scale.set(1, 1, mirror ? 1 : -1)
  }, [columnIndex, gridGroupIndex, houseId, levelIndex, ref])

  useEffect(() => {
    const unsub1 = subscribeKey(houses[houseId], "position", go)
    const unsub2 = subscribeKey(layouts, houseId, go)

    go()

    return () => {
      unsub1()
      unsub2()
    }
  }, [columnIndex, go, gridGroupIndex, houseId, levelIndex, ref])
}
