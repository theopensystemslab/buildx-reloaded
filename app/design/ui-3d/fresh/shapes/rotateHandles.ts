import { CircleGeometry, Group, Mesh, PlaneGeometry } from "three"
import { PI } from "../../../../utils/math"
import handleMaterial from "../handleMaterial"
import {
  HouseTransformsGroup,
  RotateHandleMeshUserData,
  RotateHandlesGroup,
  RotateHandlesGroupUserData,
  UserDataTypeEnum,
} from "../scene/userData"
import { getActiveHouseUserData } from "../helpers/sceneQueries"

const ROTATE_HANDLE_OFFSET = 5
const ROTATE_HANDLE_SIZE = 0.3
const rotateHandleCircleGeometry = new CircleGeometry(0.5, 16)

const createRotateHandles = (
  houseTransformsGroup: HouseTransformsGroup
): RotateHandlesGroup => {
  const meshUserData: RotateHandleMeshUserData = {
    type: UserDataTypeEnum.Enum.RotateHandleMesh,
  }

  const circleMesh1 = new Mesh(rotateHandleCircleGeometry, handleMaterial)
  circleMesh1.position.set(0, 0, -ROTATE_HANDLE_OFFSET)
  circleMesh1.rotation.x = -PI / 2
  circleMesh1.userData = meshUserData

  const planeMesh1 = new Mesh(
    new PlaneGeometry(ROTATE_HANDLE_SIZE, ROTATE_HANDLE_OFFSET),
    handleMaterial
  )
  planeMesh1.rotation.x = -PI / 2
  planeMesh1.position.set(0, 0, -ROTATE_HANDLE_OFFSET / 2)
  planeMesh1.userData = meshUserData

  const circleMesh2 = new Mesh(rotateHandleCircleGeometry, handleMaterial)
  circleMesh2.rotation.x = -PI / 2
  circleMesh2.userData = meshUserData

  const planeMesh2 = new Mesh(
    new PlaneGeometry(ROTATE_HANDLE_OFFSET, ROTATE_HANDLE_SIZE),
    handleMaterial
  )
  planeMesh2.rotation.x = -PI / 2
  planeMesh2.userData = meshUserData

  const handleGroup: RotateHandlesGroup = new Group() as RotateHandlesGroup
  handleGroup.add(circleMesh1, planeMesh1, circleMesh2, planeMesh2)
  handleGroup.position.setY(0.01)

  const groupUserData: RotateHandlesGroupUserData = {
    type: UserDataTypeEnum.Enum.RotateHandlesGroup,
    update: () => {
      const { width, length } =
        houseTransformsGroup.userData.unsafeGetActiveLayoutGroup().userData

      planeMesh2.position.set(-width / 1.05, 0, length / 2)
      circleMesh2.position.set(-ROTATE_HANDLE_OFFSET - width / 4, 0, length / 2)
    },
  }

  handleGroup.userData = groupUserData

  return handleGroup
}

export default createRotateHandles
