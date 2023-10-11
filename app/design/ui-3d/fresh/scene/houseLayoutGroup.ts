import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import {
  Box3,
  BoxGeometry,
  Group,
  Matrix3,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Scene,
  Vector3,
} from "three"
import { OBB } from "three-stdlib"
import { ColumnLayout } from "../../../../db/layouts"
import { A, O, T } from "../../../../utils/functions"
import { setVisible, yAxis } from "../../../../utils/three"
import { DEBUG } from "../../../state/constants"
import siteCtx, { getModeBools } from "../../../state/siteCtx"
import {
  getLayoutGroupColumnGroups,
  getSortedVisibleColumnGroups,
} from "../helpers/sceneQueries"
import createStretchHandle from "../shapes/stretchHandle"
import {
  createColumnGroups,
  getVanillaColumn,
  splitColumnGroups,
} from "./columnGroup"
import {
  HouseLayoutGroup,
  HouseLayoutGroupUse,
  HouseLayoutGroupUserData,
  HouseTransformsGroup,
  isHouseTransformsGroup,
  isModuleGroup,
  ModuleGroupUserData,
  UserDataTypeEnum,
} from "./userData"

export const AABB_OFFSET = 1

export const obbMaterial = new MeshBasicMaterial({
  color: "blue",
  wireframe: true,
  // transparent: true
})

const aabbMaterial = new MeshBasicMaterial({
  color: "red",
  wireframe: true,
  // transparent: true
})

export const houseLayoutToLevelTypes = (columnLayout: ColumnLayout) =>
  pipe(
    columnLayout,
    A.head,
    O.map(({ gridGroups }) =>
      pipe(
        gridGroups,
        A.map(({ levelType }) => levelType)
      )
    ),
    O.getOrElse((): string[] => [])
  )

export const createHouseLayoutGroup = ({
  houseTransformsGroup,
  systemId,
  houseId,
  dnas,
  houseLayout,
  use,
}: {
  houseTransformsGroup: HouseTransformsGroup
  systemId: string
  houseId: string
  dnas: string[]
  houseLayout: ColumnLayout
  use: HouseLayoutGroupUse
}): T.Task<HouseLayoutGroup> =>
  pipe(
    createColumnGroups({
      systemId,
      houseId,
      houseLayout,
      houseTransformsGroup,
    }),
    T.chain((columnGroups) => {
      const houseLayoutGroup = new Group() as HouseLayoutGroup

      const activeColumnGroupCount = columnGroups.length

      const sectionType =
        houseLayout[0].gridGroups[0].modules[0].module.structuredDna.sectionType

      const width = houseLayout[0].gridGroups[0].modules[0].module.width
      const height = houseLayout[0].gridGroups.reduce(
        (acc, v) => acc + v.modules[0].module.height,
        0
      )
      const length = columnGroups.reduce(
        (acc, columnGroup) => acc + columnGroup.userData.length,
        0
      )
      const obb = new OBB()
      const aabb = new Box3()
      const levelTypes = houseLayoutToLevelTypes(houseLayout)

      return pipe(
        getVanillaColumn({ systemId, sectionType, levelTypes }),
        T.map((vanillaColumn) => {
          const computeLength = () =>
            pipe(
              houseLayoutGroup,
              getLayoutGroupColumnGroups,
              A.partition((columnGroup) => columnGroup.visible),
              ({ left: hiddenColumnGroups, right: activeColumnGroups }) => {
                if (houseLayoutGroup.visible) {
                  hiddenColumnGroups.forEach((columnGroup) => {
                    columnGroup.removeFromParent()
                  })
                }

                return activeColumnGroups.reduce(
                  (acc, v) => acc + v.userData.length,
                  0
                )
              }
            )

          const updateLength = (maybeLength?: number) => {
            const { length: oldLength } = houseLayoutGroup.userData

            const houseTransformsGroup =
              houseLayoutGroup.parent as HouseTransformsGroup

            const nextLength = maybeLength ?? computeLength()

            houseLayoutGroup.userData.length = nextLength

            houseLayoutGroup.position.setZ(-nextLength / 2)

            houseTransformsGroup.position.add(
              new Vector3(0, 0, (nextLength - oldLength) / 2).applyAxisAngle(
                yAxis,
                houseTransformsGroup.rotation.y
              )
            )

            houseLayoutGroup.userData.updateBBs()
          }

          const updateActiveColumnGroupCount = (n: number) => {
            houseLayoutGroup.userData.activeColumnGroupCount = n
          }

          const updateDnas = () => {
            let result: string[][] = []
            pipe(
              houseLayoutGroup,
              getSortedVisibleColumnGroups,
              A.map((v) => {
                v.traverse((node) => {
                  if (isModuleGroup(node) && node.visible) {
                    const { dna } = node.userData as ModuleGroupUserData
                    if (
                      node.parent?.userData.type !==
                      UserDataTypeEnum.Enum.GridGroup
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
            const nextDnas = result.flat()

            houseLayoutGroup.userData.dnas = nextDnas

            const houseTransformsGroup =
              houseLayoutGroup.parent as HouseTransformsGroup

            if (
              houseTransformsGroup.userData.activeLayoutGroupUuid ===
              houseLayoutGroup.uuid
            ) {
              return houseTransformsGroup.userData.updateActiveLayoutDnas(
                nextDnas
              )
            } else {
              return Promise.resolve()
            }
          }

          const initStretchZHandles = () => {
            const { startColumnGroup, endColumnGroup } =
              splitColumnGroups(columnGroups)

            const { siteMode } = getModeBools(siteCtx.mode)

            const backStretchZHandleGroup = createStretchHandle({
              axis: "z",
              side: 1,
              houseTransformsGroup,
            })
            endColumnGroup.add(backStretchZHandleGroup)
            setVisible(backStretchZHandleGroup, !siteMode)

            const frontStretchZHandleGroup = createStretchHandle({
              axis: "z",
              side: -1,
              houseTransformsGroup,
            })
            startColumnGroup.add(frontStretchZHandleGroup)
            setVisible(frontStretchZHandleGroup, !siteMode)
          }

          const updateBBs = () => {
            const { width, height, length } = houseLayoutGroup.userData

            pipe(
              houseLayoutGroup.parent,
              O.fromNullable,
              O.map((houseTransformsGroup) => {
                if (!isHouseTransformsGroup(houseTransformsGroup)) return

                const { x, y, z } = houseTransformsGroup.position

                const scaleFactor = 1.1

                const center = new Vector3(x, y + height / 2, z)
                const halfSize = new Vector3(
                  width / 2,
                  height / 2,
                  length / 2
                ).multiplyScalar(scaleFactor)
                const rotation = new Matrix3().setFromMatrix4(
                  new Matrix4().extractRotation(houseTransformsGroup.matrix)
                )

                houseLayoutGroup.userData.obb.set(center, halfSize, rotation)

                // Get the rotation matrix as a Matrix4
                const rotationMatrix4 = new Matrix4().setFromMatrix3(
                  houseLayoutGroup.userData.obb.rotation
                )

                // Initialize min and max vectors to extreme values
                let min = new Vector3(Infinity, Infinity, Infinity)
                let max = new Vector3(-Infinity, -Infinity, -Infinity)

                // AABB corners, DELTA to make it bigger so we can pre-empt
                // which houses to OBB-intersect-check
                ;[
                  new Vector3(
                    halfSize.x + AABB_OFFSET,
                    halfSize.y + AABB_OFFSET,
                    halfSize.z + AABB_OFFSET
                  ),
                  new Vector3(
                    -(halfSize.x + AABB_OFFSET),
                    halfSize.y + AABB_OFFSET,
                    halfSize.z + AABB_OFFSET
                  ),
                  new Vector3(
                    halfSize.x + AABB_OFFSET,
                    -(halfSize.y + AABB_OFFSET),
                    halfSize.z + AABB_OFFSET
                  ),
                  new Vector3(
                    halfSize.x + AABB_OFFSET,
                    halfSize.y + AABB_OFFSET,
                    -(halfSize.z + AABB_OFFSET)
                  ),
                  new Vector3(
                    -(halfSize.x + AABB_OFFSET),
                    -(halfSize.y + AABB_OFFSET),
                    halfSize.z + AABB_OFFSET
                  ),
                  new Vector3(
                    -(halfSize.x + AABB_OFFSET),
                    halfSize.y + AABB_OFFSET,
                    -(halfSize.z + AABB_OFFSET)
                  ),
                  new Vector3(
                    halfSize.x + AABB_OFFSET,
                    -(halfSize.y + AABB_OFFSET),
                    -(halfSize.z + AABB_OFFSET)
                  ),
                  new Vector3(
                    -(halfSize.x + AABB_OFFSET),
                    -(halfSize.y + AABB_OFFSET),
                    -(halfSize.z + AABB_OFFSET)
                  ),
                ].forEach((offset) => {
                  offset.applyMatrix4(rotationMatrix4)
                  offset.add(center)
                  min.min(offset)
                  max.max(offset)
                })

                // Set the AABB
                houseLayoutGroup.userData.aabb.set(min, max)

                if (DEBUG) {
                  renderBBs()
                }

                invalidate()
              })
            )
          }

          const renderOBB = () =>
            pipe(
              houseTransformsGroup.parent,
              O.fromNullable,
              O.map((scene) => {
                const size = obb.halfSize.clone().multiplyScalar(2)

                if (houseLayoutGroup.userData.lastOBB)
                  scene.remove(houseLayoutGroup.userData.lastOBB)

                const geom = new BoxGeometry(size.x, size.y, size.z)
                const mesh = new Mesh(geom, obbMaterial)
                mesh.position.copy(obb.center)
                mesh.setRotationFromMatrix(
                  new Matrix4().setFromMatrix3(obb.rotation)
                )
                mesh.userData.type = "OBB"
                scene.add(mesh)
                houseLayoutGroup.userData.lastOBB = mesh
              })
            )

          const renderAABB = () =>
            pipe(
              houseTransformsGroup.parent,
              O.fromNullable,
              O.map((scene) => {
                const size = new Vector3()
                aabb.getSize(size)

                const center = new Vector3()
                aabb.getCenter(center)

                if (houseLayoutGroup.userData.lastAABB)
                  scene.remove(houseLayoutGroup.userData.lastAABB)

                const geom = new BoxGeometry(size.x, size.y, size.z)
                const mesh = new Mesh(geom, aabbMaterial)
                mesh.position.copy(center)
                mesh.userData.type = "AABB"
                scene.add(mesh)
                houseLayoutGroup.userData.lastAABB = mesh
              })
            )

          const renderBBs = () => {
            renderOBB()
            renderAABB()
          }

          const userData: HouseLayoutGroupUserData = {
            type: UserDataTypeEnum.Enum.HouseLayoutGroup,
            dnas,
            houseLayout,
            activeColumnGroupCount,
            sectionType,
            levelTypes,
            width,
            height,
            length,
            obb,
            aabb,
            vanillaColumn,
            use,
            initStretchZHandles,
            updateLength,
            updateActiveColumnGroupCount,
            updateDnas,
            updateBBs,
            renderBBs,
          }

          houseLayoutGroup.userData = userData
          houseLayoutGroup.add(...columnGroups)
          houseLayoutGroup.position.setZ(-length / 2)

          initStretchZHandles()

          return houseLayoutGroup as HouseLayoutGroup
        })
      )
    })
  )
