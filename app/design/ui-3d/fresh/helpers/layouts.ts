import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import {
  BufferGeometry,
  BufferGeometryLoader,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
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
import { A, Num, O, Ord, pipeLog, R, S, T } from "../../../../utils/functions"
import { getLayoutsWorker } from "../../../../workers"
import { getMaterial } from "../systems"
import {
  ColumnGroupUserData,
  ElementMeshUserData,
  GridGroupUserData,
  HouseRootGroupUserData,
  ModuleGroupUserData,
  UserDataTypeEnum,
} from "../userData"
import { createStretchHandle } from "./handles"

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
  gridGroupIndex,
  module: { speckleBranchUrl, length, dna },
}: {
  systemId: string
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
        houseId: "",
      }) as MeshStandardMaterial
      // material.clippingPlanes = clippingPlanes
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
    gridGroups,
    columnIndex,
    startColumn = false,
    endColumn = false,
  }: {
    systemId: string
    gridGroups: GridGroup[]
    columnIndex: number
    startColumn?: boolean
    endColumn?: boolean
  }): T.Task<Group> =>
  async () => {
    const columnGroup = new Group()

    for (let { modules, y, levelIndex } of gridGroups) {
      const gridGroup = new Group()
      let length = 0

      for (let { z, module, gridGroupIndex } of modules) {
        const moduleGroup = await createModuleGroup({
          systemId,
          module,
          gridGroupIndex,
        })

        moduleGroup.scale.set(1, 1, endColumn ? 1 : -1)
        moduleGroup.position.set(
          0,
          y,
          endColumn ? z + module.length / 2 : z - module.length / 2
        )

        gridGroup.add(moduleGroup)

        length += module.length
      }

      const gridGroupUserData: GridGroupUserData = {
        type: UserDataTypeEnum.Enum.GridGroup,
        levelIndex,
        length,
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

    return columnGroup
  }

export const createColumnGroups = ({
  systemId,
  houseLayout,
}: {
  systemId: string
  houseLayout: ColumnLayout
}): T.Task<Group[]> =>
  pipe(
    houseLayout,
    A.traverseWithIndex(T.ApplicativeSeq)(
      (i, { gridGroups, z, columnIndex }) => {
        const startColumn = i === 0
        const endColumn = i === houseLayout.length - 1

        const task = createColumnGroup({
          systemId,
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

export const houseLayoutToHouseGroup = ({
  systemId,
  houseId,
  houseLayout,
}: {
  systemId: string
  houseId: string
  houseLayout: ColumnLayout
}): T.Task<Group> =>
  pipe(
    createColumnGroups({
      systemId,
      houseLayout,
    }),
    T.chain((columnGroups) => async () => {
      const topLevelHouseGroup = new Group()
      const zCenterHouseGroup = new Group()

      const BIG_NUMBER = 999

      const clippingPlanes: Plane[] = [
        new Plane(new Vector3(BIG_NUMBER, 0, 0), 0),
        new Plane(new Vector3(0, BIG_NUMBER, 0), 0),
        new Plane(new Vector3(0, 0, BIG_NUMBER), 0),
      ]

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

      const vanillaColumn = await getVanillaColumn({ systemId, levelTypes })()

      const houseGroupUserData: Partial<HouseRootGroupUserData> = {
        type: UserDataTypeEnum.Enum.HouseRootGroup,
        systemId,
        houseId,
        width,
        length,
        height,
        modifiedMaterials: {},
        obb,
        clippingPlanes,
        sectionType,
        levelTypes,
        vanillaColumn,
        columnCount: columnGroups.length,
        houseLayout,
      }
      topLevelHouseGroup.userData = houseGroupUserData

      zCenterHouseGroup.add(...columnGroups)
      zCenterHouseGroup.position.setZ(-length / 2)
      zCenterHouseGroup.userData.type =
        UserDataTypeEnum.Enum.HouseColumnsContainerGroup

      topLevelHouseGroup.add(zCenterHouseGroup)

      pipe(
        columnGroups,
        A.findFirst((x) => x.userData.columnIndex === 0),
        O.map((firstColumn) => {
          const stretchHandle = createStretchHandle({
            houseId,
            axis: "z",
            direction: -1,
            length,
            width,
          })
          firstColumn.add(stretchHandle)
        })
      )

      pipe(
        columnGroups,
        A.findFirst((x) => x.userData.columnIndex === columnGroups.length - 1),
        O.map((lastColumn) => {
          const stretchHandle = createStretchHandle({
            houseId,
            axis: "z",
            direction: 1,
            length,
            width,
          })
          stretchHandle.position.z += lastColumn.userData.length
          lastColumn.add(stretchHandle)
        })
      )

      return topLevelHouseGroup
    })
  )

export const createHouseGroup = ({
  systemId,
  houseId,
  dnas,
  friendlyName,
}: {
  systemId: string
  houseId: string
  dnas: string[]
  friendlyName: string
}): T.Task<Group> =>
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
    ),
    T.chain((houseLayout) =>
      houseLayoutToHouseGroup({ systemId, houseId, houseLayout })
    ),
    T.map((group) => {
      group.userData.friendlyName = friendlyName
      return group
    })
  )

export const addColumnToHouse = (houseGroup: Object3D, columnGroup: Object3D) =>
  pipe(
    houseGroup.children,
    A.head,
    O.map((zCenterHouseGroup) => void zCenterHouseGroup.add(columnGroup))
  )

export const removeColumnFromHouse = (
  houseGroup: Object3D,
  columnGroup: Object3D
) =>
  pipe(
    houseGroup.children,
    A.head,
    O.map((zCenterHouseGroup) => void zCenterHouseGroup.remove(columnGroup))
  )

export const columnSorter = A.sort(
  pipe(
    Num.Ord,
    Ord.contramap((x: Object3D) => x.userData.columnIndex)
  )
)

export const insertVanillaColumn =
  (houseGroup: Group, direction: 1 | -1): T.Task<void> =>
  async () => {
    const { levelTypes, systemId, columnCount } =
      houseGroup.userData as HouseRootGroupUserData

    const vanillaColumn =
      vanillaColumns[getVanillaColumnsKey({ systemId, levelTypes })]

    const vanillaColumnGroup = await createColumnGroup({
      systemId,
      gridGroups: vanillaColumn.gridGroups,
      columnIndex: -1,
    })()

    pipe(
      houseGroup.children,
      A.head,
      O.map((zCenterHouseGroup) => {
        const { children: columnGroups } = zCenterHouseGroup

        const vanillaColumnLength = vanillaColumnGroup.userData.length

        if (direction === 1) {
          pipe(
            columnGroups,
            A.filter((x) => x.userData.columnIndex >= columnCount - 2),
            A.sort(
              pipe(
                Num.Ord,
                Ord.contramap((x: Object3D) => x.userData.columnIndex)
              )
            ),
            ([penultimateColumnGroup, endColumnGroup]) => {
              vanillaColumnGroup.position.setZ(
                penultimateColumnGroup.position.z +
                  penultimateColumnGroup.userData.length / 2 +
                  vanillaColumnLength / 2
              )
              addColumnToHouse(houseGroup, vanillaColumnGroup)

              vanillaColumnGroup.userData.columnIndex =
                penultimateColumnGroup.userData.columnIndex + 1

              endColumnGroup.userData.columnIndex++

              houseGroup.userData.columnCount = columnCount + 1
            }
          )
        } else if (direction === -1) {
          pipe(
            columnGroups,
            columnSorter,
            ([startColumnGroup, ...restColumnGroups]) => {
              for (let columnGroup of restColumnGroups) {
                columnGroup.position.add(new Vector3(0, 0, vanillaColumnLength))
                columnGroup.userData.columnIndex++
              }

              vanillaColumnGroup.userData.columnIndex = 1
              vanillaColumnGroup.position.setZ(
                startColumnGroup.position.z +
                  startColumnGroup.userData.length +
                  vanillaColumnLength / 2
              )
              addColumnToHouse(houseGroup, vanillaColumnGroup)

              houseGroup.userData.columnCount = columnCount + 1
            }
          )
        }
      })
    )
  }

export const subtractPenultimateColumn = (
  houseGroup: Group,
  direction: 1 | -1
) => {
  pipe(
    houseGroup.children,
    A.head,
    O.map(({ children }) => {
      const columnCount: number = houseGroup.userData.columnCount

      if (columnCount <= 3) return

      if (direction === 1) {
        pipe(
          children,
          A.filter((x) => x.userData.columnIndex >= columnCount - 2),
          A.sort(
            pipe(
              Num.Ord,
              Ord.contramap((x: Object3D) => x.userData.columnIndex)
            )
          ),
          ([penultimateColumnGroup, endColumnGroup]) => {
            endColumnGroup.position.sub(
              new Vector3(0, 0, penultimateColumnGroup.userData.length)
            )

            removeColumnFromHouse(houseGroup, penultimateColumnGroup)

            houseGroup.userData.columnCount = columnCount - 1
            endColumnGroup.userData.columnIndex--
          }
        )
      } else if (direction === -1) {
        pipe(
          children,
          A.sort(
            pipe(
              Num.Ord,
              Ord.contramap((x: Object3D) => x.userData.columnIndex)
            )
          ),
          ([_, secondColumnGroup, ...restColumnGroups]) => {
            const subV = new Vector3(0, 0, secondColumnGroup.userData.length)

            restColumnGroups.forEach((columnGroup) => {
              columnGroup.position.sub(subV)
              columnGroup.userData.columnIndex--
            })

            removeColumnFromHouse(houseGroup, secondColumnGroup)

            houseGroup.userData.columnCount = columnCount - 1
          }
        )
      }
    })
  )
}

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
