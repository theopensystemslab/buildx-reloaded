import { useCallback, useEffect } from "react"
import { Box2, Vector2 } from "three"
import { proxy } from "valtio"
import { subscribeKey } from "valtio/utils"
import houses from "./houses"
import { ColumnLayout } from "./layouts"

const dimensions = proxy<Record<string, Box2>>({})

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

    const vc = new Vector2(0 + px, 0 + pz)

    const v0 = new Vector2(-x0 + px, z0 + pz).rotateAround(
      vc,
      -houses[houseId].rotation
    )

    const v1 = new Vector2(x0 + px, z1 + pz).rotateAround(
      vc,
      -houses[houseId].rotation
    )

    dimensions[houseId] = new Box2(v0, v1)
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
