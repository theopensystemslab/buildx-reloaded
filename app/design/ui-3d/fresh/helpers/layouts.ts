import { liveQuery } from "dexie"
import { cartesian } from "fp-ts-std/Array"
import { pipe } from "fp-ts/lib/function"
import {
  BufferGeometry,
  BufferGeometryLoader,
  Group,
  Matrix3,
  Mesh,
  Plane,
  Vector3,
} from "three"
import { OBB } from "three-stdlib"
import { Module } from "../../../../../server/data/modules"
import layoutsDB, {
  ColumnLayout,
  getHouseLayoutsKey,
  getVanillaColumnsKey,
  GridGroup,
  VanillaColumn,
  VanillaColumnsKey,
} from "../../../../db/layouts"
import { A, combineGuards, O, R, S, T } from "../../../../utils/functions"
import { addDebugLineAtZ, setVisibility, yAxis } from "../../../../utils/three"
import { getLayoutsWorker } from "../../../../workers"
import siteCtx, { getModeBools } from "../../../state/siteCtx"
import { renderOBB } from "../dimensions"
import createRotateHandles from "../shapes/rotateHandles"
import createStretchHandle from "../shapes/stretchHandle"
import { getMaterial } from "../systems"
import {
  ColumnGroup,
  ColumnGroupUserData,
  ElementMeshUserData,
  GridGroupUserData,
  HouseLayoutGroupUserData,
  HouseTransformsGroupUserData,
  isRotateHandlesGroup,
  isStretchHandleMesh,
  ModuleGroupUserData,
  UserDataTypeEnum,
} from "../userData"
import { findAllGuardDown } from "./sceneQueries"

export const DEBUG = false

export const BIG_CLIP_NUMBER = 999

// serialized layout key : column
export let vanillaColumns: Record<string, VanillaColumn> = {}

export const getVanillaColumn = ({
  systemId,
  levelTypes,
}: VanillaColumnsKey): T.Task<VanillaColumn> => {
  const key = getVanillaColumnsKey({ systemId, levelTypes })

  return pipe(
    vanillaColumns,
    R.lookup(key),
    O.match(
      () => {
        const layoutsWorker = getLayoutsWorker()
        if (!layoutsWorker) throw new Error(`no layouts worker`)
        return () =>
          layoutsWorker.getVanillaColumn({
            systemId,
            levelTypes,
          })
      },
      (vanillaColumn) => T.of(vanillaColumn)
    )
  )
}

liveQuery(() => layoutsDB.vanillaColumns.toArray()).subscribe(
  (dbVanillaColumns) => {
    for (let dbVanillaColumn of dbVanillaColumns) {
      const { systemId, levelTypes, vanillaColumn } = dbVanillaColumn
      vanillaColumns[getVanillaColumnsKey({ systemId, levelTypes })] =
        vanillaColumn
    }
  }
)

const loader = new BufferGeometryLoader()

// speckle branch url : geometry by ifc tag
export let models: Record<string, Record<string, BufferGeometry>> = {}

const putModel = ({
  geometries,
  speckleBranchUrl,
}: {
  speckleBranchUrl: string
  geometries: any
}) => {
  const loadedModels: Record<string, BufferGeometry> = pipe(
    geometries,
    R.map((x) => loader.parse(x) as BufferGeometry),
    R.reduceWithIndex(S.Ord)({}, (ifcTag, acc, geometry) => {
      geometry.computeVertexNormals()
      return {
        ...acc,
        [ifcTag]: geometry,
      }
    })
  )
  models[speckleBranchUrl] = loadedModels

  return loadedModels
}

liveQuery(() => layoutsDB.models.toArray()).subscribe((dbModels) => {
  for (let { speckleBranchUrl, geometries } of dbModels) {
    if (!(speckleBranchUrl in models)) {
      putModel({ speckleBranchUrl, geometries })
    }
  }
})

export const getGeometry = ({
  speckleBranchUrl,
  ifcTag,
}: {
  speckleBranchUrl: string
  ifcTag: string
}) => models[speckleBranchUrl][ifcTag]

export const createModuleGroup = async ({
  systemId,
  houseId,
  gridGroupIndex,
  module: { speckleBranchUrl, length, dna },
}: {
  systemId: string
  houseId: string
  gridGroupIndex: number
  module: Module
}) => {
  const moduleGroup = new Group()

  const processModel = (
    modelGeometriesByIfcTag: Record<string, BufferGeometry>
  ) => {
    for (let ifcTag of Object.keys(modelGeometriesByIfcTag)) {
      const geometry = getGeometry({ speckleBranchUrl, ifcTag })
      const material = getMaterial({
        systemId,
        ifcTag,
        houseId,
      })
      material.wireframe = false
      const mesh = new Mesh(geometry, material)
      mesh.castShadow = true

      const elementMeshUserData: ElementMeshUserData = {
        type: UserDataTypeEnum.Enum.ElementMesh,
        ifcTag,
      }
      mesh.userData = elementMeshUserData
      moduleGroup.add(mesh)
    }
  }

  await pipe(
    models,
    R.lookup(speckleBranchUrl),
    O.match(
      async () => {
        const model = await layoutsDB.models.get(speckleBranchUrl)
        if (model === undefined)
          throw new Error(`no model for ${speckleBranchUrl}`)
        const loadedModel = putModel(model)
        processModel(loadedModel)
      },
      async (loadedModel) => {
        processModel(loadedModel)
      }
    )
  )

  const moduleGroupUserData: ModuleGroupUserData = {
    type: UserDataTypeEnum.Enum.ModuleGroup,
    gridGroupIndex,
    dna,
    length,
  }

  moduleGroup.userData = moduleGroupUserData

  return moduleGroup
}

export const createColumnGroup =
  ({
    systemId,
    houseId,
    gridGroups,
    columnIndex,
    startColumn = false,
    endColumn = false,
  }: {
    systemId: string
    houseId: string
    gridGroups: GridGroup[]
    columnIndex: number
    startColumn?: boolean
    endColumn?: boolean
  }): T.Task<ColumnGroup> =>
  async () => {
    const columnGroup = new Group()

    for (let { modules, y, levelIndex } of gridGroups) {
      const gridGroup = new Group()
      let length = 0

      for (let { z, module, gridGroupIndex } of modules) {
        const moduleGroup = await createModuleGroup({
          systemId,
          houseId,
          module,
          gridGroupIndex,
        })

        moduleGroup.scale.set(1, 1, endColumn ? 1 : -1)
        moduleGroup.position.set(
          0,
          0,
          endColumn ? z + module.length / 2 : z - module.length / 2
        )

        gridGroup.position.setY(y)
        gridGroup.add(moduleGroup)

        length += module.length
      }

      const gridGroupUserData: GridGroupUserData = {
        type: UserDataTypeEnum.Enum.GridGroup,
        levelIndex,
        length,
        height: modules[0].module.height,
      }
      gridGroup.userData = gridGroupUserData

      columnGroup.add(gridGroup)
    }

    const columnGroupUserData: ColumnGroupUserData = {
      type: UserDataTypeEnum.Enum.ColumnGroup,
      columnIndex,
      length: gridGroups[0].length,
      startColumn,
      endColumn,
    }

    columnGroup.userData = columnGroupUserData

    return columnGroup as ColumnGroup
  }

export const createColumnGroups = ({
  systemId,
  houseId,
  houseLayout,
}: {
  systemId: string
  houseId: string
  houseLayout: ColumnLayout
}): T.Task<ColumnGroup[]> =>
  pipe(
    houseLayout,
    A.traverseWithIndex(T.ApplicativeSeq)(
      (i, { gridGroups, z, columnIndex }) => {
        const startColumn = i === 0
        const endColumn = i === houseLayout.length - 1

        const task = createColumnGroup({
          systemId,
          houseId,
          gridGroups,
          startColumn,
          endColumn,
          columnIndex,
        })

        return pipe(
          task,
          T.map((columnGroup) => {
            columnGroup.position.set(0, 0, z)
            return columnGroup
          })
        )
      }
    )
  )

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

export const createLayoutGroup = ({
  systemId,
  houseId,
  dnas,
  houseLayout,
}: {
  systemId: string
  houseId: string
  dnas: string[]
  houseLayout: ColumnLayout
}) =>
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

          const removeAllHandles = () => {
            pipe(
              layoutGroup,
              findAllGuardDown(
                combineGuards(isRotateHandlesGroup, isStretchHandleMesh)
              )
            ).forEach((x) => {
              x.removeFromParent()
            })
          }

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

                refreshHandles()
              }

              return true // Indicate assignment success
            },
          }

          layoutGroup.userData = new Proxy(userData, userDataHandler)

          const refreshHandles = () => {
            removeAllHandles()

            const { siteMode } = getModeBools(siteCtx.mode)

            const { length: houseLength, width: houseWidth } =
              layoutGroup.userData

            const rotateHandles = createRotateHandles({
              houseWidth,
              houseLength,
            })

            setVisibility(rotateHandles, siteMode)

            layoutGroup.add(rotateHandles)

            pipe(
              [1, -1] as Array<1 | -1>,
              cartesian(["x", "z"] as Array<"z" | "x">),
              A.map(([axis, side]) => {
                const stretchHandleGroup = createStretchHandle({
                  axis,
                  side,
                  houseLength,
                  houseWidth,
                })
                if (axis === "z") {
                  if (side === 1) {
                    endColumnGroup.add(stretchHandleGroup)
                  } else {
                    startColumnGroup.add(stretchHandleGroup)
                  }
                } else {
                  stretchHandleGroup.position.setZ(houseLength / 2)
                  layoutGroup.add(stretchHandleGroup)
                }
                setVisibility(stretchHandleGroup, !siteMode)
              })
            )
          }

          refreshHandles()

          return layoutGroup
        })
      )
    })
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

export const createInitialHouse = ({
  systemId,
  houseId,
  dnas,
  friendlyName,
  houseTypeId,
}: {
  systemId: string
  houseId: string
  dnas: string[]
  friendlyName: string
  houseTypeId: string
}): T.Task<Group> =>
  pipe(
    getHouseLayout({ systemId, dnas }),
    T.chain((houseLayout) =>
      createLayoutGroup({ houseLayout, dnas, systemId, houseId })
    ),
    T.map((layoutGroup) => {
      const transformsGroup = new Group()

      const NORMAL_DIRECTION = -1

      const clippingPlanes: Plane[] = [
        new Plane(new Vector3(NORMAL_DIRECTION, 0, 0), BIG_CLIP_NUMBER),
        new Plane(new Vector3(0, NORMAL_DIRECTION, 0), BIG_CLIP_NUMBER),
        new Plane(new Vector3(0, 0, NORMAL_DIRECTION), BIG_CLIP_NUMBER),
      ]

      const houseTransformsGroupUserData: HouseTransformsGroupUserData = {
        type: UserDataTypeEnum.Enum.HouseTransformsGroup,
        systemId,
        houseId,
        clippingPlanes,
        friendlyName,
        activeChildUuid: layoutGroup.uuid,
        houseTypeId,
      }
      transformsGroup.userData = houseTransformsGroupUserData
      transformsGroup.add(layoutGroup)

      return transformsGroup
    })
  )

export const splitColumnGroups = (columnGroups: ColumnGroup[]) =>
  pipe(
    columnGroups,
    A.partition(
      ({ userData: { columnIndex } }) =>
        columnIndex === 0 || columnIndex === columnGroups.length - 1
    ),
    ({ left: midColumnGroups, right: [startColumnGroup, endColumnGroup] }) => ({
      startColumnGroup,
      endColumnGroup,
      midColumnGroups,
    })
  )
