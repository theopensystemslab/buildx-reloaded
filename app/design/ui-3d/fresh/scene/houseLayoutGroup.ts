import { pipe } from "fp-ts/lib/function"
import { Group, Matrix3, Vector3 } from "three"
import { OBB } from "three-stdlib"
import { ColumnLayout } from "../../../../db/layouts"
import { A, O, T } from "../../../../utils/functions"
import { setVisible, yAxis } from "../../../../utils/three"
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
}: {
  systemId: string
  houseId: string
  dnas: string[]
  houseLayout: ColumnLayout
}): T.Task<HouseLayoutGroup> =>
  pipe(
    createColumnGroups({
      systemId,
      houseId,
      houseLayout,
    }),
    T.chain((columnGroups) => {
      const layoutGroup = new Group() as HouseLayoutGroup

      const columnCount = columnGroups.length

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
              layoutGroup,
              getLayoutGroupColumnGroups,
              A.partition((columnGroup) => columnGroup.visible),
              ({ left: hiddenColumnGroups, right: activeColumnGroups }) => {
                hiddenColumnGroups.forEach((columnGroup) => {
                  columnGroup.removeFromParent()
                })

                return activeColumnGroups.reduce(
                  (acc, v) => acc + v.userData.length,
                  0
                )
              }
            )

          const updateLength = (maybeLength?: number) => {
            const { length: oldLength } = layoutGroup.userData

            const nextLength = maybeLength ?? computeLength()

            layoutGroup.userData.length = nextLength

            layoutGroup.position.setZ(-nextLength / 2)

            layoutGroup.parent?.position.add(
              new Vector3(0, 0, (nextLength - oldLength) / 2).applyAxisAngle(
                yAxis,
                layoutGroup.parent.rotation.y
              )
            )

            const houseTransformsGroup = layoutGroup.parent!

            const { x, y, z } = houseTransformsGroup.position

            const center = new Vector3(x, y + height / 2, z)
            const halfSize = new Vector3(width / 2, height / 2, nextLength / 2)
            const rotation = new Matrix3().setFromMatrix4(
              houseTransformsGroup.matrix
            )

            layoutGroup.userData.obb.set(center, halfSize, rotation)

            // if (DEBUG && houseTransformsGroup.parent) {
            //   renderOBB(
            //     layoutGroup.userData.obb,
            //     houseTransformsGroup.parent
            //   )
            // }
          }

          const updateDnas = () => {
            let result: string[][] = []
            pipe(
              layoutGroup,
              getSortedVisibleColumnGroups,
              // -> findAllGuardDown
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
            layoutGroup.userData.dnas = nextDnas

            const houseTransformsGroup =
              layoutGroup.parent as HouseTransformsGroup

            houseTransformsGroup.userData.refreshAltLayouts()

            if (
              houseTransformsGroup.userData.activeLayoutGroupUuid ===
              layoutGroup.uuid
            ) {
              houseTransformsGroup.userData.updateActiveLayoutDnas(nextDnas)
            }
          }

          const initStretchZHandles = () => {
            const { startColumnGroup, endColumnGroup } =
              splitColumnGroups(columnGroups)

            const { siteMode } = getModeBools(siteCtx.mode)

            const { length: houseLength, width: houseWidth } =
              layoutGroup.userData
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

          const userData: HouseLayoutGroupUserData = {
            type: UserDataTypeEnum.Enum.HouseLayoutGroup,
            dnas,
            houseLayout,
            columnCount,
            sectionType,
            levelTypes,
            width,
            height,
            length,
            obb,
            modifiedMaterials: {},
            vanillaColumn,
            initStretchZHandles,
            updateLength,
            updateDnas,
          }

          layoutGroup.userData = userData
          layoutGroup.add(...columnGroups)
          layoutGroup.position.setZ(-length / 2)
          layoutGroup.userData.initStretchZHandles()

          return layoutGroup as HouseLayoutGroup
        })
      )
    })
  )
