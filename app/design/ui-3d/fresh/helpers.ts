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
import { Module } from "../../../../server/data/modules"
import layoutsDB, {
  ColumnLayout,
  getHouseLayoutsKey,
  getVanillaColumnsKey,
  GridGroup,
  VanillaColumn,
  VanillaColumnsKey,
} from "../../../db/layouts"
import { A, Num, O, Ord, R, S } from "../../../utils/functions"
import { getLayoutsWorker } from "../../../workers"
import { getMaterial } from "./systems"
import {
  ColumnGroupUserData,
  ElementMeshUserData,
  GridGroupUserData,
  HouseRootGroupUserData,
  ModuleGroupUserData,
  UserDataTypeEnum,
} from "./userData"

// serialized layout key : column
export let vanillaColumns: Record<string, VanillaColumn> = {}

export const getVanillaColumn = ({
  systemId,
  levelTypes,
}: VanillaColumnsKey) => {
  const key = getVanillaColumnsKey({ systemId, levelTypes })
  return vanillaColumns[key]
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

liveQuery(() => layoutsDB.models.toArray()).subscribe((dbModels) => {
  for (let { speckleBranchUrl, geometries } of dbModels) {
    if (!(speckleBranchUrl in models)) {
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

export const moduleToGroup = ({
  systemId,
  gridGroupIndex,
  module: { speckleBranchUrl, length, dna },
  clippingPlanes,
}: {
  systemId: string
  gridGroupIndex: number
  module: Module
  clippingPlanes: Plane[]
}) => {
  const moduleGroup = new Group()
  const taggedModelGeometries = models[speckleBranchUrl]
  for (let ifcTag of Object.keys(taggedModelGeometries)) {
    const geometry = getGeometry({ speckleBranchUrl, ifcTag })
    const material = getMaterial({
      systemId,
      ifcTag,
      houseId: "",
    }) as MeshStandardMaterial
    material.clippingPlanes = clippingPlanes
    const mesh = new Mesh(geometry, material)
    mesh.castShadow = true

    const elementMeshUserData: ElementMeshUserData = {
      type: UserDataTypeEnum.Enum.ElementMesh,
      ifcTag,
    }
    mesh.userData = elementMeshUserData
    moduleGroup.add(mesh)
  }

  const moduleGroupUserData: ModuleGroupUserData = {
    type: UserDataTypeEnum.Enum.ModuleGroup,
    gridGroupIndex,
    dna,
    length,
    // module
  }

  moduleGroup.userData = moduleGroupUserData

  return moduleGroup
}

export const createColumnGroup = ({
  systemId,
  gridGroups,
  columnIndex,
  startColumn = false,
  endColumn = false,
  clippingPlanes,
}: {
  systemId: string
  gridGroups: GridGroup[]
  columnIndex: number
  startColumn?: boolean
  endColumn?: boolean
  clippingPlanes: Plane[]
}): Group => {
  const columnGroup = new Group()

  gridGroups.forEach(({ modules, y, levelIndex }) => {
    const gridGroup = new Group()
    const length = modules.reduce(
      (acc, { z, module, gridGroupIndex }): number => {
        const moduleGroup = moduleToGroup({
          systemId,
          module,
          gridGroupIndex,
          clippingPlanes,
        })
        moduleGroup.scale.set(1, 1, endColumn ? 1 : -1)
        moduleGroup.position.set(
          0,
          y,
          endColumn ? z + module.length / 2 : z - module.length / 2
        )
        gridGroup.add(moduleGroup)
        return acc + module.length
      },
      0
    )
    const gridGroupUserData: GridGroupUserData = {
      type: UserDataTypeEnum.Enum.GridGroup,
      levelIndex,
      length,
    }
    gridGroup.userData = gridGroupUserData
    columnGroup.add(gridGroup)
  })

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

export const houseLayoutToColumns = ({
  systemId,
  houseId,
  houseLayout,
  clippingPlanes,
}: {
  systemId: string
  houseId: string
  houseLayout: ColumnLayout
  clippingPlanes: Plane[]
}): Group[] =>
  pipe(
    houseLayout,
    A.mapWithIndex((i, { gridGroups, z, columnIndex, length }) => {
      const startColumn = i === 0
      const endColumn = i === houseLayout.length - 1

      const group = createColumnGroup({
        systemId,
        gridGroups,
        startColumn,
        endColumn,
        columnIndex,
        clippingPlanes,
      })
      group.position.set(0, 0, z)
      return group
    })
  )

export let houseLayouts: Record<string, ColumnLayout> = {}

liveQuery(() => layoutsDB.houseLayouts.toArray()).subscribe(
  (dbHouseLayouts) => {
    for (let { systemId, dnas, layout } of dbHouseLayouts) {
      houseLayouts[getHouseLayoutsKey({ systemId, dnas })] = layout
    }
  }
)

const houseLayoutToHouseGroup = async ({
  systemId,
  houseId,
  houseLayout,
}: {
  systemId: string
  houseId: string
  houseLayout: ColumnLayout
}) => {
  const clippingPlanes: Plane[] = [
    new Plane(new Vector3(1, 0, 0), 0),
    new Plane(new Vector3(0, 1, 0), 0),
    new Plane(new Vector3(0, 0, 1), 0),
  ]

  const columnGroups = houseLayoutToColumns({
    systemId,
    houseId,
    houseLayout,
    clippingPlanes,
  })
  const topLevelHouseGroup = new Group()
  const zCenterHouseGroup = new Group()

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
  const houseGroupUserData: Partial<HouseRootGroupUserData> = {
    type: UserDataTypeEnum.Enum.HouseRootGroup,
    systemId,
    houseId,
    width,
    length,
    height,
    // dnas,
    // friendlyName,
    modifiedMaterials: {},
    obb,
    clippingPlanes,
    sectionType,
    levelTypes: houseLayoutToLevelTypes(houseLayout),
    columnCount: columnGroups.length,
  }
  topLevelHouseGroup.userData = houseGroupUserData
  zCenterHouseGroup.add(...columnGroups)
  zCenterHouseGroup.position.setZ(-length / 2)
  topLevelHouseGroup.add(zCenterHouseGroup)

  return topLevelHouseGroup
}

export const createHouseGroup = async ({
  systemId,
  houseId,
  dnas,
}: // friendlyName,
{
  systemId: string
  houseId: string
  dnas: string[]
  // friendlyName: string
}) => {
  const houseGroup = pipe(
    houseLayouts,
    R.lookup(getHouseLayoutsKey({ systemId, dnas })),
    O.match(
      async () => {
        const layoutsWorker = getLayoutsWorker()
        if (!layoutsWorker) throw new Error(`no layouts worker`)
        const houseLayout = await layoutsWorker.processLayout({
          systemId,
          dnas,
        })
        return houseLayoutToHouseGroup({
          systemId,
          houseId,
          houseLayout,
        })
      },
      (houseLayout) =>
        houseLayoutToHouseGroup({ systemId, houseId, houseLayout })
    )
  )

  return houseGroup
}

export const getFirstHouseLayout = () =>
  pipe(
    houseLayouts,
    R.keys,
    A.head,
    O.chain((k) => pipe(houseLayouts, R.lookup(k)))
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

export const insertVanillaColumn = (houseGroup: Group, direction: 1 | -1) => {
  const { levelTypes, systemId, columnCount, clippingPlanes } =
    houseGroup.userData as HouseRootGroupUserData
  pipe(
    houseGroup.children,
    A.head,
    O.map((zCenterHouseGroup) => {
      const { children: columnGroups } = zCenterHouseGroup

      const vanillaColumn =
        vanillaColumns[getVanillaColumnsKey({ systemId, levelTypes })]

      const vanillaColumnGroup = createColumnGroup({
        systemId,
        gridGroups: vanillaColumn.gridGroups,
        columnIndex: -1,
        clippingPlanes,
      })

      const vanillaColumnLength = vanillaColumnGroup.userData.length

      if (direction === 1) {
        pipe(
          columnGroups,
          A.findFirst((x) => x.userData.columnIndex === columnCount - 1),
          O.map((endColumnGroup) => {
            vanillaColumnGroup.position.setZ(
              endColumnGroup.position.z + vanillaColumnLength / 2
            )
            addColumnToHouse(houseGroup, vanillaColumnGroup)

            endColumnGroup.position.add(new Vector3(0, 0, vanillaColumnLength))

            vanillaColumnGroup.userData.columnIndex =
              endColumnGroup.userData.columnIndex

            endColumnGroup.userData.columnIndex++

            houseGroup.userData.columnCount = columnCount + 1
          })
        )
      } else if (direction === -1) {
        pipe(
          columnGroups,
          A.sort(
            pipe(
              Num.Ord,
              Ord.contramap((x: Object3D) => x.userData.columnIndex)
            )
          ),
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
