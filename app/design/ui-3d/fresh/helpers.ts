import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { BufferGeometry, BufferGeometryLoader, Group, Mesh } from "three"
import { Module } from "../../../../server/data/modules"
import { ifcTagToElement } from "../../../data/elements"
import layoutsDB, {
  ColumnLayout,
  GridGroup,
  getHouseLayoutsKey,
  VanillaColumn,
  getVanillaColumnsKey,
  VanillaColumnsKey,
  invertVanillaColumnsKey,
} from "../../../db/layouts"
import systemsDB from "../../../db/systems"
import { House } from "../../../db/user"
import { A, O, R, S } from "../../../utils/functions"
import { getLayoutsWorker } from "../../../workers"
import { getMaterial } from "./systems"

// serialized layout key : column
export let vanillaColumns: Record<string, VanillaColumn> = {}

const getVanillaColumn = ({ systemId, levelTypes }: VanillaColumnsKey) => {
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
  module: { speckleBranchUrl, systemId },
  endColumn = false,
}: {
  module: Module
  endColumn?: boolean
}) => {
  const moduleGroup = new Group()
  const taggedModelGeometries = models[speckleBranchUrl]
  for (let ifcTag of Object.keys(taggedModelGeometries)) {
    const mesh = new Mesh(
      getGeometry({ speckleBranchUrl, ifcTag }),
      getMaterial({ systemId, ifcTag, houseId: "" })
    )
    mesh.castShadow = true
    moduleGroup.add(mesh)
  }

  return moduleGroup
}

export const createColumnGroup = ({
  gridGroups,
  endColumn = false,
}: {
  gridGroups: GridGroup[]
  endColumn?: boolean
}): Group => {
  const columnGroup = new Group()

  gridGroups.forEach(({ modules, y }) => {
    modules.forEach(({ z, module }) => {
      const moduleGroup = moduleToGroup({ module, endColumn })
      moduleGroup.scale.set(1, 1, endColumn ? 1 : -1)
      moduleGroup.position.set(
        0,
        y,
        endColumn ? z + module.length / 2 : z - module.length / 2
      )
      columnGroup.add(moduleGroup)
    })
  })

  return columnGroup
}

export const layoutToColumns = (layout: ColumnLayout): Group[] =>
  pipe(
    layout,
    A.mapWithIndex((i, { gridGroups, z, columnIndex, length }) => {
      const startColumn = i === 0
      const endColumn = i === layout.length - 1

      const group = createColumnGroup({
        gridGroups,
        endColumn,
      })
      group.position.set(0, 0, z)
      group.userData = {
        columnIndex,
        length,
        endColumn,
        startColumn,
      }
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

export const getFirstHouseLayout = () =>
  pipe(
    houseLayouts,
    R.keys,
    A.head,
    O.chain((k) => pipe(houseLayouts, R.lookup(k)))
  )

export const insertVanillaColumn = (houseGroup: Group, direction: 1 | -1) => {
  const { children } = houseGroup

  const levelTypes = pipe(
    children
    // write me...
    // or maybe we put levelTypes on the house group's userData?
  )

  pipe(
    children,
    A.findFirst((x) =>
      direction === 1 ? x.userData.endColumn : x.userData.startColumn
    ),
    O.map((x) => {})
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

export const createHouseGroup = async (house: House) => {
  const { systemId, dnas } = house

  const houseLayoutToHouseGroup = async (houseLayout: ColumnLayout) => {
    const columnGroups = layoutToColumns(houseLayout)
    const houseGroup = new Group()
    houseGroup.userData = {
      ...house,
      levelTypes: houseLayoutToLevelTypes(houseLayout),
    }
    houseGroup.add(...columnGroups)
    return houseGroup
  }

  const houseGroup = pipe(
    houseLayouts,
    R.lookup(getHouseLayoutsKey({ systemId, dnas })),
    O.match(async () => {
      const layoutsWorker = getLayoutsWorker()
      if (!layoutsWorker) throw new Error(`no layouts worker`)
      const houseLayout = await layoutsWorker.processLayout({ systemId, dnas })
      return houseLayoutToHouseGroup(houseLayout)
    }, houseLayoutToHouseGroup)
  )

  return houseGroup
}

// export const houseToLayout = (house: House): ColumnLayout => {

//   return undefined as any
// }
