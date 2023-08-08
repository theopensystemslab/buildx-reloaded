import { CircleGeometry, Group, Mesh, PlaneGeometry } from "three"
import { RoundedBoxGeometry } from "three-stdlib"
import { PI } from "../../../../utils/math"
import { setInvisible } from "../../../../utils/three"
import handleMaterial from "../handleMaterial"
import {
  RotateHandleMeshUserData,
  StretchHandleMeshUserData,
  UserDataTypeEnum,
} from "../userData"

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

  setInvisible(mesh)

  return mesh
}

const ROTATE_HANDLE_OFFSET = 5
const ROTATE_HANDLE_SIZE = 0.3
const rotateHandleCircleGeometry = new CircleGeometry(0.5, 16)

export const createRotateHandles = ({
  width,
  length,
}: {
  width: number
  length: number
}) => {
  const userData: RotateHandleMeshUserData = {
    type: UserDataTypeEnum.Enum.RotateHandleMesh,
  }

  const circleMesh1 = new Mesh(rotateHandleCircleGeometry, handleMaterial)
  circleMesh1.position.set(0, 0, -ROTATE_HANDLE_OFFSET)
  circleMesh1.rotation.x = -PI / 2
  circleMesh1.userData = userData

  const planeMesh1 = new Mesh(
    new PlaneGeometry(ROTATE_HANDLE_SIZE, ROTATE_HANDLE_OFFSET),
    handleMaterial
  )
  planeMesh1.rotation.x = -PI / 2
  planeMesh1.position.set(0, 0, -ROTATE_HANDLE_OFFSET / 2)
  planeMesh1.userData = userData

  const circleMesh2 = new Mesh(rotateHandleCircleGeometry, handleMaterial)
  circleMesh2.rotation.x = -PI / 2
  circleMesh2.position.set(-ROTATE_HANDLE_OFFSET - width / 4, 0, length / 2)
  circleMesh2.userData = userData

  const planeMesh2 = new Mesh(
    new PlaneGeometry(ROTATE_HANDLE_OFFSET, ROTATE_HANDLE_SIZE),
    handleMaterial
  )
  planeMesh2.rotation.x = -PI / 2
  planeMesh2.position.set(-width / 1.05, 0, length / 2)
  planeMesh2.userData = userData

  const handleGroup = new Group()
  handleGroup.add(circleMesh1, planeMesh1, circleMesh2, planeMesh2)

  setInvisible(handleGroup)

  return handleGroup
}
