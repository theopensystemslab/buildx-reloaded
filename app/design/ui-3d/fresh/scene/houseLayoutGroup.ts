import { pipe } from "fp-ts/lib/function"
import { Group, Matrix3, Vector3 } from "three"
import { OBB } from "three-stdlib"
import { ColumnLayout } from "../../../../db/layouts"
import { A, O, T } from "../../../../utils/functions"
import { setVisible, yAxis } from "../../../../utils/three"
import { DEBUG } from "../../../state/constants"
import siteCtx, { getModeBools } from "../../../state/siteCtx"
import { renderOBB } from "../dimensions"
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
  isModuleGroup,
  ModuleGroupUserData,
  UserDataTypeEnum,
} from "./userData"

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
  systemId,
  houseId,
  dnas,
  houseLayout,
  use,
}: {
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

            houseLayoutGroup.userData.updateOBB()
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
                  if (isModuleGroup(node)) {
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

            const { length: houseLength, width: houseWidth } =
              houseLayoutGroup.userData
            const backStretchZHandleGroup = createStretchHandle({
              axis: "z",
              side: 1,
              houseLength,
              houseWidth,
            })
            endColumnGroup.add(backStretchZHandleGroup)
            setVisible(backStretchZHandleGroup, !siteMode)

            const frontStretchZHandleGroup = createStretchHandle({
              axis: "z",
              side: -1,
              houseLength,
              houseWidth,
            })
            startColumnGroup.add(frontStretchZHandleGroup)
            setVisible(frontStretchZHandleGroup, !siteMode)
          }

          const updateOBB = () => {
            const { width, height, length } = houseLayoutGroup.userData

            const houseTransformsGroup =
              houseLayoutGroup.parent as HouseTransformsGroup

            const { x, y, z } = houseTransformsGroup.position

            const center = new Vector3(x, y + height / 2, z)
            const halfSize = new Vector3(width / 2, height / 2, length / 2)
            const rotation = new Matrix3().setFromMatrix4(
              houseTransformsGroup.matrix
            )

            houseLayoutGroup.userData.obb.set(center, halfSize, rotation)

            if (DEBUG && houseTransformsGroup.parent) {
              renderOBB(
                houseLayoutGroup.userData.obb,
                houseTransformsGroup.parent
              )
            }
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
            modifiedMaterials: {},
            vanillaColumn,
            use,
            initStretchZHandles,
            updateLength,
            updateActiveColumnGroupCount,
            updateDnas,
            updateOBB,
          }

          houseLayoutGroup.userData = userData
          houseLayoutGroup.add(...columnGroups)
          houseLayoutGroup.position.setZ(-length / 2)
          houseLayoutGroup.userData.initStretchZHandles()

          return houseLayoutGroup as HouseLayoutGroup
        })
      )
    })
  )
