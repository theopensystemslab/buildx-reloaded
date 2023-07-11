import { createColumn } from "@tanstack/react-table"
import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import {
  BufferGeometry,
  BufferGeometryLoader,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
} from "three"
import { Module } from "../../../../server/data/modules"
import { ifcTagToElement } from "../../../data/elements"
import layoutsDB, {
  ColumnLayout,
  GridGroup,
  PositionedColumn,
  VanillaColumn,
} from "../../../db/layouts"
import systemsDB from "../../../db/systems"
import { House } from "../../../db/user"
import { A, O, R, S } from "../../../utils/functions"

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

liveQuery(async () => {
  const models = await layoutsDB.models.toArray()
  const elements = await systemsDB.elements.toArray()
  return { models, elements }
}).subscribe(({ models: dbModels, elements: dbElements }) => {
  for (let { speckleBranchUrl, geometries, systemId } of dbModels) {
    if (!(speckleBranchUrl in models)) {
      const loadedModels: Record<string, BufferGeometry> = pipe(
        geometries,
        R.map((x) => loader.parse(x) as BufferGeometry),
        R.reduceWithIndex(S.Ord)({}, (ifcTag, acc, geometry) => {
          const el = ifcTagToElement({
            systemId,
            elements: dbElements,
            ifcTag,
          })
          if (!el) return acc
          return {
            ...acc,
            [el.name]: geometry,
          }
        })
      )
      models[speckleBranchUrl] = loadedModels
    }
  }
})

const basicMaterial = new MeshBasicMaterial({
  color: "tomato",
  side: DoubleSide,
})

export const getGeometry = ({
  speckleBranchUrl,
  ifcTag,
}: {
  speckleBranchUrl: string
  ifcTag: string
}) => models[speckleBranchUrl][ifcTag]

export const getMaterial = ({}: {
  systemId?: string
  houseId?: string
  elementName?: string
} = {}): Material => basicMaterial

export const moduleToGroup = ({ speckleBranchUrl }: Module) => {
  const moduleGroup = new Group()
  const taggedModelGeometries = models[speckleBranchUrl]
  for (let ifcTag of Object.keys(taggedModelGeometries)) {
    const mesh = new Mesh(
      getGeometry({ speckleBranchUrl, ifcTag }),
      getMaterial()
    )
    moduleGroup.add(mesh)
  }

  return moduleGroup
}

export const insert1VanillaColumn = () => {
  console.log("insert 1 vanilla")
}

export const createColumnGroup = (gridGroups: GridGroup[]): Group => {
  const columnGroup = new Group()

  gridGroups.forEach(({ modules, y }) => {
    modules.forEach(({ z, module }) => {
      const moduleGroup = moduleToGroup(module)
      moduleGroup.position.set(0, y, z)
      columnGroup.add(moduleGroup)
    })
  })

  return columnGroup
}

export const layoutToColumns = (layout: ColumnLayout): Group[] =>
  pipe(
    layout,
    A.map(({ gridGroups, z }) => {
      const group = createColumnGroup(gridGroups)
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

// export const houseToLayout = (house: House): ColumnLayout => {

//   return undefined as any
// }
