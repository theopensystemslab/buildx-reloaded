import { invalidate } from "@react-three/fiber"
import { flow, pipe } from "fp-ts/lib/function"
import {
  BoxGeometry,
  Group,
  Material,
  Matrix3,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from "three"
import { OBB } from "three-stdlib"
import { A, O } from "../../../utils/functions"
import { isMesh, xAxis, yAxis, zAxis } from "../../../utils/three"
import { HouseRootGroupUserData, UserDataTypeEnum } from "./userData"

export const DEBUG = false

let lastMesh: Mesh | null

const renderOBB = (obb: OBB, scene: Object3D) => {
  const size = obb.halfSize.clone().multiplyScalar(2)

  if (lastMesh) scene.remove(lastMesh)

  const geom = new BoxGeometry(size.x, size.y, size.z)
  const material = new MeshBasicMaterial({ color: "tomato" })
  const mesh = new Mesh(geom, material)
  mesh.position.copy(obb.center)
  mesh.setRotationFromMatrix(new Matrix4().setFromMatrix3(obb.rotation))
  scene.add(mesh)
  lastMesh = mesh
}

export const updateHouseOBB = (houseGroup: Group) => {
  const houseGroupUserData = houseGroup.userData as HouseRootGroupUserData

  const { width, height, length } = houseGroupUserData

  const { x, y, z } = houseGroup.position

  const center = new Vector3(x, y + height / 2, z)
  const halfSize = new Vector3(width / 2, height / 2, length / 2)
  const rotation = new Matrix3().setFromMatrix4(houseGroup.matrix)

  houseGroupUserData.obb.set(center, halfSize, rotation)

  if (DEBUG && houseGroup.parent)
    renderOBB(houseGroupUserData.obb, houseGroup.parent)
}

export const updateHouseWidth = (houseGroup: Group) => {}

export const updateHouseHeight = (houseGroup: Group) => {}

export const updateClippingPlanes = (houseGroup: Group) => {
  const {
    clippingPlanes,
    clippingPlanes: [planeX, planeY, planeZ],
  } = houseGroup.userData as HouseRootGroupUserData

  houseGroup.updateMatrix()

  planeX.set(new Vector3(1, 0, 0), 0)
  planeX.applyMatrix4(houseGroup.matrix)
  planeY.set(new Vector3(0, 1, 0), 0)
  planeY.applyMatrix4(houseGroup.matrix)
  planeZ.set(new Vector3(0, 0, 1), 0)
  planeZ.applyMatrix4(houseGroup.matrix)
}

export const updateHouseLength = (houseGroup: Group) => {
  pipe(
    houseGroup.children,
    A.head,
    O.map((zCenterHouseGroup) => {
      const { children: columnGroups } = zCenterHouseGroup

      houseGroup.userData.length = columnGroups.reduce(
        (acc, columnGroup) => acc + columnGroup.userData.length,
        0
      )

      zCenterHouseGroup.position.setZ(-houseGroup.userData.length / 2)
    })
  )
}

export const updateEverything = (houseGroup: Group) => {
  updateHouseLength(houseGroup)
  updateHouseOBB(houseGroup)
  updateClippingPlanes(houseGroup)
  invalidate()
}
