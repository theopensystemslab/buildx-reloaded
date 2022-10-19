import { useCallback, useEffect } from "react"
import { Box2, Box3, Vector2, Vector3 } from "three"
import { proxy, ref } from "valtio"
import { subscribeKey } from "valtio/utils"
import houses from "./houses"
import { ColumnLayout } from "./layouts"

const dimensions = proxy<Record<string, Box3>>({})

export const useDimensionsSubscriber = (
  houseId: string,
  columns: ColumnLayout
) => {
  const update = useCallback(() => {
    if (columns.length < 1) return

    const x0 = -columns[0].gridGroups[0].modules[0].module.width / 2
    const x1 = -x0
    const z0 = columns[0].gridGroups[0].modules[0].z
    const lastColumn = columns[columns.length - 1]
    const lastGridGroup =
      lastColumn.gridGroups[lastColumn.gridGroups.length - 1]
    const lastModule = lastGridGroup.modules[lastGridGroup.modules.length - 1]
    const z1 = lastColumn.z + lastModule.z + lastModule.module.length

    const [px, , pz] = houses[houseId].position

    const yAxis = new Vector3(0, 1, 0)

    const v0 = new Vector3(x0, 0, z0)
    const v1 = new Vector3(-x0, 1, z1)

    v0.applyAxisAngle(yAxis, houses[houseId].rotation)
    v1.applyAxisAngle(yAxis, houses[houseId].rotation)

    v0.add(new Vector3(px, 0, pz))
    v1.add(new Vector3(px, 0, pz))

    const box = new Box3(v0, v1)

    dimensions[houseId] = ref(box)
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

export default dimensions
