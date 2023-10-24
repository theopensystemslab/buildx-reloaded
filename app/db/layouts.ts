import Dexie from "dexie"
import { Module } from "../../server/data/modules"
import { LastFetchStamped } from "./systems"
import { A, T } from "../utils/functions"
import { getVanillaModule } from "../workers/layouts/vanilla"
import { pipe } from "fp-ts/lib/function"

export type PositionedModule = {
  module: Module
  z: number
  moduleIndex: number
}

export const createPositionedModules = (
  module: Module,
  acc?: PositionedModule[]
): PositionedModule[] => {
  if (acc && acc.length > 0) {
    const prev = acc[acc.length - 1]
    return [
      ...acc,
      {
        module,
        moduleIndex: prev.moduleIndex + 1,
        z: prev.z + prev.module.length / 2 + module.length / 2,
      },
    ]
  } else {
    return [
      {
        module,
        moduleIndex: 0,
        z: module.length / 2,
      },
    ]
  }
}

export const createInitialPositionedModules = (
  modules: Module[]
): PositionedModule[] => {
  let result: PositionedModule[] = []

  for (let i = 0; i < modules.length; i++) {
    const dz = i === 0 ? 0 : result[i - 1].z + result[i - 1].module.length / 2

    result[i] = {
      module: modules[i],
      moduleIndex: i,
      z: dz + modules[i].length / 2,
    }
  }

  return result
}

export type Row = {
  positionedModules: Array<PositionedModule>
  levelType: string
  gridUnits: number
  rowLength: number
  vanillaModule: Module
}

export const createRow = (modules: Module[]): T.Task<Row> => {
  const {
    systemId,
    structuredDna: { sectionType, positionType, levelType, gridType },
  } = modules[0]

  let positionedModules: PositionedModule[] = [],
    gridUnits = 0,
    rowLength = 0

  for (let i = 0; i < modules.length; i++) {
    positionedModules = createPositionedModules(modules[i], positionedModules)
    ;(gridUnits += modules[i].structuredDna.gridUnits),
      (rowLength += modules[i].length)
  }

  return pipe(
    getVanillaModule({
      systemId,
      sectionType,
      positionType,
      levelType,
      gridType,
    }),
    T.map((vanillaModule) => ({
      positionedModules,
      gridUnits,
      rowLength,
      levelType,
      vanillaModule,
    }))
  )
}

export type PositionedRow = Row & {
  levelIndex: number
  y: number
}

export const createRowLayout = (rows: Module[][]): T.Task<PositionedRow[]> => {
  return pipe(
    rows,
    A.traverse(T.ApplicativeSeq)(createRow),
    T.map(
      A.reduceWithIndex([], (levelIndex, acc: PositionedRow[], row: Row) => {
        const levelLetter = row.levelType[0]

        const y =
          levelLetter === "F"
            ? 0
            : acc[levelIndex - 1].y +
              acc[levelIndex - 1].positionedModules[0].module.height

        return [...acc, { ...row, levelIndex, y }]
      })
    )
  )
}

export type Column = {
  positionedRows: Array<PositionedRow>
}

export const createColumn = (rows: Module[][]): T.Task<Column> =>
  pipe(
    rows,
    createRowLayout,
    T.map((positionedRows) => ({ positionedRows }))
  )

export type PositionedColumn = Column & {
  z: number
  columnIndex: number
  columnLength: number
}

export type RowLayout = Array<PositionedRow>
export type ColumnLayout = Array<PositionedColumn>

export const createColumnLayout = (
  matrix: Module[][][]
): T.Task<ColumnLayout> =>
  pipe(
    matrix,
    A.traverse(T.ApplicativeSeq)(createColumn),
    T.map(
      A.reduceWithIndex(
        [],
        (
          columnIndex: number,
          acc: PositionedColumn[],
          { positionedRows }: Column
        ) => {
          const columnLength = positionedRows[0].rowLength
          if (columnIndex === 0) {
            return [
              {
                positionedRows,
                columnIndex,
                columnLength,
                z: 0,
              },
            ]
          } else {
            const last = acc[columnIndex - 1]

            return [
              ...acc,
              {
                positionedRows,
                columnIndex,
                columnLength,
                z: last.z + last.columnLength,
              },
            ]
          }
        }
      )
    )
  )

export const roundp = (v: number, precision: number = 3) => {
  const multiplier = Math.pow(10, precision)
  return Math.round(v * multiplier) / multiplier
}

export type IndexedModel = LastFetchStamped<{
  speckleBranchUrl: string
  geometries: any
  systemId: string
}>

export type HouseLayoutsKey = {
  systemId: string
  dnas: string[]
}

export type ModuleIdentifier = {
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
}

export type HouseModuleIdentifier = ModuleIdentifier & {
  houseId: string
}

export type SystemHouseModuleIdentifier = HouseModuleIdentifier & {
  systemId: string
}

export const getHouseLayoutsKey = ({ systemId, dnas }: HouseLayoutsKey) =>
  `${systemId}:${dnas}`

export const invertHouseLayoutsKey = (key: string): HouseLayoutsKey => {
  const [systemId, dnasString] = key.split(":")
  const dnas = dnasString.split(",")
  return { systemId, dnas }
}

export type IndexedLayout = {
  systemId: string
  dnas: string[]
  layout: ColumnLayout
}

export type IndexedVanillaModule = {
  systemId: string
  sectionType: string
  positionType: string
  levelType: string
  gridType: string
  moduleDna: string
}

export type VanillaColumn = Omit<PositionedColumn, "z" | "columnIndex">

export type IndexedVanillaColumn = {
  systemId: string
  sectionType: string
  levelTypes: string[]
  vanillaColumn: VanillaColumn
}

export type VanillaColumnsKey = {
  systemId: string
  sectionType: string
  levelTypes: string[]
}

export const getVanillaColumnsKey = ({
  systemId,
  sectionType,
  levelTypes,
}: VanillaColumnsKey): string => `${systemId}:${sectionType}:${levelTypes}`

export const invertVanillaColumnsKey = (key: string): VanillaColumnsKey => {
  const [systemId, sectionType, levelTypesString] = key.split(":")
  const levelTypes = levelTypesString.split(",")
  return { systemId, sectionType, levelTypes }
}

class LayoutsDatabase extends Dexie {
  models: Dexie.Table<IndexedModel, string>
  houseLayouts: Dexie.Table<IndexedLayout, string>
  vanillaModules: Dexie.Table<IndexedVanillaModule, string>
  vanillaColumns: Dexie.Table<IndexedVanillaColumn, string>

  constructor() {
    super("LayoutsDatabase")
    this.version(1).stores({
      models: "speckleBranchUrl,systemId",
      houseLayouts: "[systemId+dnas]",
      vanillaModules: "[systemId+sectionType+positionType+levelType+gridType]",
      vanillaColumns: "[systemId+sectionType+levelTypes]",
    })
    this.houseLayouts = this.table("houseLayouts")
    this.models = this.table("models")
    this.vanillaModules = this.table("vanillaModules")
    this.vanillaColumns = this.table("vanillaColumns")
  }
}

// Create Dexie database
const layoutsDB = new LayoutsDatabase()

export default layoutsDB
