import { useCallback, useEffect, useRef } from "react"
import { Box3, Matrix3, Matrix4, Vector3 } from "three"
import { OBB } from "three-stdlib"
import { proxy, ref } from "valtio"
import { subscribeKey } from "valtio/utils"
import { abs } from "../utils/math"
import houses from "./houses"
import { ColumnLayout } from "./layouts"

const obbs = proxy<Record<string, OBB>>({})

export const useOBBSubscriber = (houseId: string, columns: ColumnLayout) => {
  const preTransM = useRef(new Matrix4())
  const postTransM = useRef(new Matrix4())
  const rotationMatrix = useRef(new Matrix4())

  const update = useCallback(() => {
    if (columns.length < 1) return

    const x0 = -columns[0].gridGroups[0].modules[0].module.width / 2
    const z0 = columns[0].gridGroups[0].modules[0].z
    const lastColumn = columns[columns.length - 1]
    const lastGridGroup =
      lastColumn.gridGroups[lastColumn.gridGroups.length - 1]
    const lastModule = lastGridGroup.modules[lastGridGroup.modules.length - 1]
    const z1 = lastColumn.z + lastModule.z + lastModule.module.length

    const length = z1 - z0

    const [px, , pz] = houses[houseId].position

    const center = new Vector3(0, 0, 0)
    const halfSize = new Vector3(x0, 1, length / 2)
    const obb = new OBB(center, halfSize)

    preTransM.current.makeTranslation(0, 0, length / 2)
    rotationMatrix.current.makeRotationY(houses[houseId].rotation)
    postTransM.current.makeTranslation(px, 0, pz)

    obb.applyMatrix4(
      postTransM.current.multiply(
        rotationMatrix.current.multiply(preTransM.current)
      )
    )
    obbs[houseId] = ref(obb)
  }, [columns, houseId])

  useEffect(() => {
    const unsubPos = subscribeKey(houses[houseId], "position", update)
    const unsubRot = subscribeKey(houses[houseId], "rotation", update)

    update()

    return () => {
      unsubPos()
      unsubRot()
    }
  }, [houseId, columns, update])
}

export default obbs
