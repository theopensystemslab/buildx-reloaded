import { pipe } from "fp-ts/lib/function"
import {
  Box3,
  BoxGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from "three"
import { OBB } from "three-stdlib"
import { A, O } from "../../../utils/functions"
import {
  findFirstGuardDown,
  getSortedVisibleColumnGroups,
} from "./helpers/sceneQueries"
import {
  HouseTransformsGroup,
  HouseTransformsGroupUserData,
  isHouseLayoutGroup,
  ModuleGroupUserData,
  UserDataTypeEnum,
} from "./scene/userData"

let lastOBB: Mesh | null
let lastAABB: Mesh | null

export const updateHouseWidth = (houseGroup: Group) => {}

export const updateHouseHeight = (houseGroup: Group) => {}

export const updateClippingPlanes = (houseGroup: Group) => {
  const {
    clippingPlanes,
    clippingPlanes: [planeX, planeY, planeZ],
  } = houseGroup.userData as HouseTransformsGroupUserData

  houseGroup.updateMatrix()

  planeX.set(new Vector3(1, 0, 0), 0)
  planeX.applyMatrix4(houseGroup.matrix)
  planeY.set(new Vector3(0, 1, 0), 0)
  planeY.applyMatrix4(houseGroup.matrix)
  planeZ.set(new Vector3(0, 0, 1), 0)
  planeZ.applyMatrix4(houseGroup.matrix)
}

export const updateDnas = (houseTransformsGroup: HouseTransformsGroup) => {
  let result: string[][] = []
  pipe(
    houseTransformsGroup,
    findFirstGuardDown(isHouseLayoutGroup),
    O.map((layoutGroup) =>
      pipe(
        layoutGroup,
        getSortedVisibleColumnGroups,
        A.map((v) => {
          v.traverse((node) => {
            if (node.userData.type === UserDataTypeEnum.Enum.ModuleGroup) {
              const { dna } = node.userData as ModuleGroupUserData
              if (
                node.parent?.userData.type !== UserDataTypeEnum.Enum.GridGroup
              )
                throw new Error("non-GridGroup parent of ModuleGroup")

              const levelIndex = node.parent!.userData.levelIndex
              if (!result[levelIndex]) {
                result[levelIndex] = []
              }
              result[levelIndex].push(dna)
            }
          })
        })
      )
    )
  )
  houseTransformsGroup.userData.dnas = result.flat()
}
