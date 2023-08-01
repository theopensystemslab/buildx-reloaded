import { Mesh } from "three"
import { RoundedBoxGeometry } from "three-stdlib"
import { PI } from "../../../../utils/math"
import handleMaterial from "../handleMaterial"
import { StretchHandleMeshUserData, UserDataTypeEnum } from "../userData"

export const createStretchHandle = ({
  houseId,
  width,
  length,
  axis,
  direction,
}: {
  houseId: string
  width: number
  length: number
  axis: "z" | "x"
  direction: 1 | -1
}) => {
  const OFFSET_XZ = 0.5
  const OFFSET_Y = 0.1

  const position: [number, number, number] =
    axis === "z"
      ? direction === 1
        ? [0, OFFSET_Y, OFFSET_XZ]
        : [0, OFFSET_Y, -OFFSET_XZ]
      : direction === 1
      ? [width / 2 + OFFSET_XZ, OFFSET_Y, 0]
      : [-(width / 2 + OFFSET_XZ), OFFSET_Y, 0]

  const rotation: [number, number, number] =
    axis === "x" ? [0, PI / 2, 0] : [0, 0, 0]

  const geometry = new RoundedBoxGeometry(
    ((axis === "z" ? width : length) * 2) / 1.5,
    1,
    1
  )
  const material = handleMaterial

  const mesh = new Mesh(geometry, material)
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.scale.set(0.4, 0.001, 0.4)
  mesh.userData = {
    type: UserDataTypeEnum.Enum.StretchHandleMesh,
    axis,
    direction,
    houseId,
  } as StretchHandleMeshUserData

  return mesh
}
