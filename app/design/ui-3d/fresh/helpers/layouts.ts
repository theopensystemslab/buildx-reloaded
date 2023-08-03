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
import { A, Num, O, Ord, R, S, T } from "../../../../utils/functions"
import { getLayoutsWorker } from "../../../../workers"
import { getMaterial } from "../systems"
import {
  ColumnGroupUserData,
  ElementMeshUserData,
  GridGroupUserData,
  HouseLayoutGroupUserData,
  HouseTransformsGroupUserData,
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
          layoutGroup.userData = userData
          layoutGroup.position.setZ(-length / 2)
          layoutGroup.add(...columnGroups)

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
            A.findFirst(
              (x) => x.userData.columnIndex === columnGroups.length - 1
            ),
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

          return layoutGroup
        })
      )
    })
  )

// export const createTransformsGroup = () => {}

// export const houseLayoutToHouseGroup = ({
//   systemId,
//   houseId,
//   houseLayout,
// }: {
//   systemId: string
//   houseId: string
//   houseLayout: ColumnLayout
// }): T.Task<Group> =>
//   pipe(
//     createColumnGroups({
//       systemId,
//       houseLayout,
//     }),
//     T.chain((columnGroups) => async () => {
//       const transformsGroup = new Group()
//       const layoutGroup = new Group()

//       const BIG_NUMBER = 999

//       const clippingPlanes: Plane[] = [
//         new Plane(new Vector3(BIG_NUMBER, 0, 0), 0),
//         new Plane(new Vector3(0, BIG_NUMBER, 0), 0),
//         new Plane(new Vector3(0, 0, BIG_NUMBER), 0),
//       ]

//       const houseTransformsGroupUserData: Partial<HouseTransformsGroupUserData> =
//         {
//           type: UserDataTypeEnum.Enum.HouseTransformsGroup,
//           systemId,
//           houseId,
//           clippingPlanes,
//         }
//       transformsGroup.userData = houseTransformsGroupUserData

//       layoutGroup.add(...columnGroups)
//       layoutGroup.position.setZ(-length / 2)
//       layoutGroup.userData.type = UserDataTypeEnum.Enum.HouseLayoutGroup

//       transformsGroup.add(layoutGroup)

//       return transformsGroup
//     })
//   )

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

      const BIG_NUMBER = 999

      const clippingPlanes: Plane[] = [
        new Plane(new Vector3(BIG_NUMBER, 0, 0), 0),
        new Plane(new Vector3(0, BIG_NUMBER, 0), 0),
        new Plane(new Vector3(0, 0, BIG_NUMBER), 0),
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

// export const createHouseGroup = ({
//   systemId,
//   houseId,
//   dnas,
//   friendlyName,
// }: {
//   systemId: string
//   houseId: string
//   dnas: string[]
//   friendlyName: string
// }): T.Task<Group> =>
//   pipe(
//     houseLayouts,
//     R.lookup(getHouseLayoutsKey({ systemId, dnas })),
//     O.match(
//       (): T.Task<ColumnLayout> => async () => {
//         const layoutsWorker = getLayoutsWorker()
//         if (!layoutsWorker) throw new Error(`no layouts worker`)
//         return await layoutsWorker.getLayout({
//           systemId,
//           dnas,
//         })
//       },
//       (houseLayout) => T.of(houseLayout)
//     ),
//     T.chain((houseLayout) =>
//       houseLayoutToHouseGroup({ systemId, houseId, houseLayout })
//     ),
//     T.map((group) => {
//       group.userData.friendlyName = friendlyName
//       return group
//     })
//   )

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
