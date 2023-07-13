import { Dodecahedron } from "@react-three/drei"
import { invalidate } from "@react-three/fiber"
import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import {
  BufferGeometry,
  BufferGeometryLoader,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three"
import { Module } from "../../../../server/data/modules"
import layoutsDB, {
  ColumnLayout,
  getHouseLayoutsKey,
  getVanillaColumnsKey,
  GridGroup,
  VanillaColumn,
  VanillaColumnsKey,
} from "../../../db/layouts"
import { House } from "../../../db/user"
import { A, Num, O, Ord, R, S } from "../../../utils/functions"
import { getLayoutsWorker } from "../../../workers"
import { getMaterial } from "./systems"

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
  module: { speckleBranchUrl, systemId, length, dna },
  endColumn = false,
}: {
  module: Module
  endColumn?: boolean
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
    const mesh = new Mesh(geometry, material)
    mesh.castShadow = true
    moduleGroup.add(mesh)
  }

  moduleGroup.userData.length = length
  moduleGroup.userData.systemId = systemId
  moduleGroup.userData.dna = dna

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

  columnGroup.userData.length = gridGroups[0].modules.reduce(
    (acc, v) => acc + v.module.length,
    0
  )
  columnGroup.userData.startColumn = false
  columnGroup.userData.endColumn = false

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
        ...group.userData,
        columnIndex,
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

  const levelTypes: string[] = houseGroup.userData.levelTypes
  const systemId: string = houseGroup.userData.systemId
  const columnGroupCount = houseGroup.userData.columnGroupCount

  const vanillaColumn =
    vanillaColumns[getVanillaColumnsKey({ systemId, levelTypes })]

  const vanillaColumnGroup = createColumnGroup(vanillaColumn)

  const vanillaColumnLength = vanillaColumnGroup.userData.length

  if (direction === 1) {
    pipe(
      children,
      A.findFirst((x) => x.userData.columnIndex === columnGroupCount - 1),
      O.map((endColumnGroup) => {
        vanillaColumnGroup.position.setZ(
          endColumnGroup.position.z + vanillaColumnLength / 2
        )
        houseGroup.add(vanillaColumnGroup)

        endColumnGroup.position.add(new Vector3(0, 0, vanillaColumnLength))

        vanillaColumnGroup.userData.columnIndex =
          endColumnGroup.userData.columnIndex

        endColumnGroup.userData.columnIndex++

        houseGroup.userData.columnGroupCount = columnGroupCount + 1

        invalidate()
      })
    )
  } else if (direction === -1) {
    pipe(
      children,
      A.partition((x) => x.userData.columnIndex !== 0),
      ({ left: [startColumnGroup], right: otherColumnGroups }) => {
        startColumnGroup.position.add(new Vector3(0, 0, -vanillaColumnLength))

        for (let otherColumnGroup of otherColumnGroups) {
          otherColumnGroup.userData.columnIndex++
        }

        vanillaColumnGroup.userData.columnIndex = 1
        vanillaColumnGroup.position.setZ(
          startColumnGroup.position.z +
            startColumnGroup.userData.length +
            vanillaColumnLength / 2
        )
        houseGroup.add(vanillaColumnGroup)

        houseGroup.userData.columnGroupCount = columnGroupCount + 1

        invalidate()
      }
    )
  }
}

export const subtractPenultimateColumn = (
  houseGroup: Group,
  direction: 1 | -1
) => {
  const { children } = houseGroup

  const columnGroupCount: number = houseGroup.userData.columnGroupCount

  if (columnGroupCount <= 3) return

  if (direction === 1) {
    pipe(
      children,
      A.filter((x) => x.userData.columnIndex >= columnGroupCount - 2),
      A.sort(
        pipe(
          Num.Ord,
          Ord.contramap((x: Object3D) => x.userData.columnIndex)
        )
      ),
      ([penultimateColumnGroup, endColumnGroup]) => {
        endColumnGroup.position.add(
          new Vector3(0, 0, -penultimateColumnGroup.userData.length)
        )

        houseGroup.remove(penultimateColumnGroup)

        houseGroup.userData.columnGroupCount = columnGroupCount - 1
        endColumnGroup.userData.columnIndex--

        invalidate()
      }
    )
  } else if (direction === -1) {
    pipe(
      children,
      A.partition((x) => x.userData.columnIndex >= 2),
      ({ left: startColumnGroups, right: otherColumnGroups }) =>
        pipe(
          startColumnGroups,
          A.sort(
            pipe(
              Num.Ord,
              Ord.contramap((x: Object3D) => x.userData.columnIndex)
            )
          ),
          ([startColumnGroup, secondColumnGroup]) => {
            startColumnGroup.position.add(
              new Vector3(0, 0, secondColumnGroup.userData.length)
            )

            houseGroup.remove(secondColumnGroup)

            houseGroup.userData.columnGroupCount = columnGroupCount - 1

            for (let otherColumnGroup of otherColumnGroups) {
              otherColumnGroup.userData.columnIndex--
            }

            invalidate()
          }
        )
    )
  }
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
      columnGroupCount: columnGroups.length,
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
