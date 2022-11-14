import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import { none, some } from "fp-ts/lib/Option"
import { useMemo } from "react"
import { Matrix4, Plane, Vector3 } from "three"
import { useSnapshot } from "valtio"
import { R } from "../utils/functions"
import { useVerticalCuts } from "./globals"
import houses from "./houses"
import { ColumnLayout } from "./layouts"

export const useVerticalCutPlanes = (
  columnLayout: ColumnLayout,
  houseId: string
) => {
  const [cuts] = useVerticalCuts()

  const house = useSnapshot(houses[houseId])

  const {
    position: { x, z },
    rotation,
  } = house

  const buildingLength = columnLayout.reduce((acc, v) => acc + v.length, 0)
  const lengthMiddle = buildingLength / 2 + z
  const widthMiddle = x

  const rotationMatrix = new Matrix4().makeRotationY(rotation)
  const translationMatrix = new Matrix4().makeTranslation(
    widthMiddle,
    0,
    lengthMiddle
  )

  const total = translationMatrix.multiply(rotationMatrix)

  const lengthPlane = useMemo(() => {
    const plane = new Plane(new Vector3(0, 0, 1), 0)
    plane.applyMatrix4(total)
    return plane
  }, [total])

  const widthPlane = useMemo(() => {
    const plane = new Plane(new Vector3(1, 0, 0), 0)
    plane.applyMatrix4(total)
    return plane
  }, [total])

  return pipe(
    cuts,
    R.filterMapWithIndex((k, b) =>
      b ? some(k === "length" ? lengthPlane : widthPlane) : none
    ),
    values
  )
}
