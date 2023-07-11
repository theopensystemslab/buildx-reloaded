import Dexie from "dexie"
import { Module } from "../../server/data/modules"
import { LastFetchStamped } from "./systems"

export type PositionedModule = {
  module: Module
  z: number
  gridGroupIndex: number
}

export type PositionedInstancedModule = {
  module: Module
  y: number
  z: number
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
}

export type PositionedRow = {
  levelIndex: number
  levelType: string
  y: number
  modules: Array<PositionedModule>
  length: number
}

export type GridGroup = PositionedRow

export type RowLayout = Array<PositionedRow>

export type PositionedColumn = {
  gridGroups: Array<PositionedRow>
  z: number
  columnIndex: number
  length: number
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

export type ColumnLayout = Array<PositionedColumn>

export type ParsedModel = {
  speckleBranchUrl: string
  geometries: any
  systemId: string
}

export type IndexedLayout = {
  layoutsKey: string
  layout: ColumnLayout
}

export type LayoutKey = {
  systemId: string
  dnas: string[]
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
  layoutsKey: string
  vanillaColumn: VanillaColumn
}

export const serializeLayoutKey = ({ systemId, dnas }: LayoutKey) =>
  `${systemId}:${dnas}`

class LayoutsDatabase extends Dexie {
  models: Dexie.Table<LastFetchStamped<ParsedModel>, string>
  houseLayouts: Dexie.Table<IndexedLayout, string>
  vanillaModules: Dexie.Table<IndexedVanillaModule, string>
  vanillaColumns: Dexie.Table<IndexedVanillaColumn, string>

  constructor() {
    super("LayoutsDatabase")
    this.version(1).stores({
      models: "speckleBranchUrl,systemId",
      layouts: "layoutsKey",
      vanillaModules: "[systemId+sectionType+positionType+levelType+gridType]",
      vanillaColumns: "layoutsKey",
    })
    this.houseLayouts = this.table("layouts")
    this.models = this.table("models")
    this.vanillaModules = this.table("vanillaModules")
    this.vanillaColumns = this.table("vanillaColumns")
  }
}

// Create Dexie database
const layoutsDB = new LayoutsDatabase()

export default layoutsDB
