import { pipe } from "fp-ts/lib/function"
import {
  BoxGeometry,
  Group,
  Matrix3,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from "three"
import { OBB } from "three-stdlib"
import { A, O } from "../../../utils/functions"
import { HouseGroupUserData } from "./userData"

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
  const houseGroupUserData = houseGroup.userData as HouseGroupUserData

  const { width, height, length } = houseGroupUserData

  const { x, y, z } = houseGroup.position

  const center = new Vector3(x, y + height / 2, z)
  const halfSize = new Vector3(width / 2, height / 2, length / 2)
  const rotation = new Matrix3().setFromMatrix4(houseGroup.matrix)

  houseGroupUserData.obb.set(center, halfSize, rotation)

  if (houseGroup.parent) renderOBB(houseGroupUserData.obb, houseGroup.parent)

  console.log(houseGroupUserData.obb)
}

export const updateHouseWidth = (houseGroup: Group) => {}

export const updateHouseHeight = (houseGroup: Group) => {}

export const updateHouseLength = (houseGroup: Group) => {
  pipe(
    houseGroup.children,
    A.head,
    O.map(({ children: columnGroups }) => {
      console.log(`houseGroup length before: ${houseGroup.userData.length}`)

      houseGroup.userData.length = columnGroups.reduce(
        (acc, columnGroup) => acc + columnGroup.userData.length,
        0
      )

      console.log(`houseGroup length after: ${houseGroup.userData.length}`)

      // updateHouseOBB(houseGroup)

      // update length should update dimensions, obb etc...
    })
  )
}
