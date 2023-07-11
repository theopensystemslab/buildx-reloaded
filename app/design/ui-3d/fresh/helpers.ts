import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { BufferGeometry, BufferGeometryLoader, Group, Mesh } from "three"
import { Module } from "../../../../server/data/modules"
import { ifcTagToElement } from "../../../data/elements"
import layoutsDB, {
  ColumnLayout,
  GridGroup,
  VanillaColumn,
} from "../../../db/layouts"
import systemsDB from "../../../db/systems"
import { A, O, R, S } from "../../../utils/functions"
import { getMaterial } from "./systems"

// serialized layout key : column
export let vanillaColumns: Record<string, VanillaColumn> = {}

liveQuery(() => layoutsDB.vanillaColumns.toArray()).subscribe(
  (dbVanillaColumns) => {
    for (let dbVanillaColumn of dbVanillaColumns) {
      const { layoutsKey, vanillaColumn } = dbVanillaColumn
      vanillaColumns[layoutsKey] = vanillaColumn
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

export const insert1VanillaColumn = () => {
  console.log("insert 1 vanilla")
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
    A.mapWithIndex((i, { gridGroups, z }) => {
      const group = createColumnGroup({
        gridGroups,
        endColumn: i === layout.length - 1,
      })
      group.position.set(0, 0, z)
      return group
    })
  )

export let houseLayouts: Record<string, ColumnLayout> = {}

liveQuery(() => layoutsDB.houseLayouts.toArray()).subscribe(
  (dbHouseLayouts) => {
    for (let { layoutsKey, layout } of dbHouseLayouts)
      houseLayouts[layoutsKey] = layout
  }
)

export const getFirstHouseLayout = () =>
  pipe(
    houseLayouts,
    R.keys,
    A.head,
    O.chain((k) => pipe(houseLayouts, R.lookup(k)))
  )

export const insertVanillaColumn = (houseGroup: Group) => {
  const { children } = houseGroup

  const { startColumnGroup, midColumnGroups, endColumnGroup } = pipe(
    children,
    A.partitionWithIndex((i) => i === 0 || i === children.length - 1),
    ({ left: midColumnGroups, right: [startColumnGroup, endColumnGroup] }) => ({
      startColumnGroup,
      endColumnGroup,
      midColumnGroups,
    })
  )

  // to start with, how can I simply update the houseGroup
  // to put a clone of the startColumnGroup
}

// export const houseToLayout = (house: House): ColumnLayout => {

//   return undefined as any
// }
