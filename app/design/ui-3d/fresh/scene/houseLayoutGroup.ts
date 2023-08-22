import { liveQuery } from "dexie"
import { cartesian } from "fp-ts-std/Array"
import { pipe } from "fp-ts/lib/function"
import { Group, Matrix3, Vector3 } from "three"
import { OBB } from "three-stdlib"
import layoutsDB, {
  ColumnLayout,
  getHouseLayoutsKey,
} from "../../../../db/layouts"
import { A, combineGuards, O, R, T } from "../../../../utils/functions"
import { setVisibility, yAxis } from "../../../../utils/three"
import { getLayoutsWorker } from "../../../../workers"
import siteCtx, { getModeBools } from "../../../state/siteCtx"
import { renderOBB } from "../dimensions"
import { findAllGuardDown } from "../helpers/sceneQueries"
import createRotateHandles from "../shapes/rotateHandles"
import createStretchHandle from "../shapes/stretchHandle"
import {
  HouseLayoutGroup,
  HouseLayoutGroupUserData,
  isRotateHandlesGroup,
  isStretchHandleMesh,
  UserDataTypeEnum,
} from "../userData"
import {
  createColumnGroups,
  getVanillaColumn,
  splitColumnGroups,
} from "./columnGroup"

const DEBUG = false

export let houseLayouts: Record<string, ColumnLayout> = {}

liveQuery(() => layoutsDB.houseLayouts.toArray()).subscribe(
  (dbHouseLayouts) => {
    for (let { systemId, dnas, layout } of dbHouseLayouts) {
      houseLayouts[getHouseLayoutsKey({ systemId, dnas })] = layout
    }
  }
)

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

export const getHouseLayout = ({
  systemId,
  dnas,
}: {
  systemId: string
  dnas: string[]
}): T.Task<ColumnLayout> =>
  pipe(
    houseLayouts,
    R.lookup(getHouseLayoutsKey({ systemId, dnas })),
    O.match(
      (): T.Task<ColumnLayout> => async () => {
        const layoutsWorker = getLayoutsWorker()
        if (!layoutsWorker) throw new Error(`no layouts worker`)
        return await layoutsWorker.getLayout({
          systemId,
          dnas,
        })
      },
      (houseLayout) => T.of(houseLayout)
    )
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
      const layoutGroup = new Group()

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
        getVanillaColumn({ systemId, levelTypes }),
        T.map((vanillaColumn) => {
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
          }

          layoutGroup.position.setZ(-length / 2)
          layoutGroup.add(...columnGroups)

          const { startColumnGroup, endColumnGroup } =
            splitColumnGroups(columnGroups)

          const userDataHandler: ProxyHandler<HouseLayoutGroupUserData> = {
            set: function (target: any, prop: any, value: any) {
              if (prop === "length") {
                const oldLength = target[prop]
                const newLength = value
                target[prop] = value

                console.log(
                  `doing stuff, oldLength: ${oldLength}; newLength: ${newLength}`
                )

                layoutGroup.position.setZ(-newLength / 2)

                layoutGroup.parent?.position.add(
                  new Vector3(0, 0, (newLength - oldLength) / 2).applyAxisAngle(
                    yAxis,
                    layoutGroup.parent.rotation.y
                  )
                )

                const houseTransformsGroup = layoutGroup.parent!

                const { x, y, z } = houseTransformsGroup.position

                const center = new Vector3(x, y + height / 2, z)
                const halfSize = new Vector3(
                  width / 2,
                  height / 2,
                  newLength / 2
                )
                const rotation = new Matrix3().setFromMatrix4(
                  houseTransformsGroup.matrix
                )

                layoutGroup.userData.obb.set(center, halfSize, rotation)

                if (DEBUG && houseTransformsGroup.parent) {
                  renderOBB(
                    layoutGroup.userData.obb,
                    houseTransformsGroup.parent
                  )
                }

                // refreshHandles()
              }

              return true // Indicate assignment success
            },
          }

          layoutGroup.userData = new Proxy(userData, userDataHandler)

          const { siteMode } = getModeBools(siteCtx.mode)

          const backStretchZHandleGroup = createStretchHandle({
            axis: "z",
            side: 1,
            houseLength: length,
            houseWidth: width,
          })
          endColumnGroup.add(backStretchZHandleGroup)
          setVisibility(backStretchZHandleGroup, !siteMode)

          const frontStretchZHandleGroup = createStretchHandle({
            axis: "z",
            side: -1,
            houseLength: length,
            houseWidth: width,
          })
          startColumnGroup.add(frontStretchZHandleGroup)
          setVisibility(frontStretchZHandleGroup, !siteMode)

          return layoutGroup as HouseLayoutGroup
        })
      )
    })
  )
