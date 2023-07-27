import Dexie from "dexie"
import { Module } from "../../server/data/modules"
import { SectionType } from "../../server/data/sectionTypes"
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

export type IndexedModel = LastFetchStamped<{
  speckleBranchUrl: string
  geometries: any
  systemId: string
}>

export type HouseLayoutsKey = {
  systemId: string
  dnas: string[]
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
  levelTypes: string[]
  vanillaColumn: VanillaColumn
}

export type VanillaColumnsKey = {
  systemId: string
  levelTypes: string[]
}

export const getVanillaColumnsKey = ({
  systemId,
  levelTypes,
}: VanillaColumnsKey): string => `${systemId}:${levelTypes}`

export const invertVanillaColumnsKey = (key: string): VanillaColumnsKey => {
  const [systemId, levelTypesString] = key.split(":")
  const levelTypes = levelTypesString.split(",")
  return { systemId, levelTypes }
}

type IndexedAltSectionTypeLayouts = {
  houseId: string
  altSectionTypeLayouts: Record<
    string,
    { layout: ColumnLayout; sectionType: SectionType }
  >
}

class LayoutsDatabase extends Dexie {
  models: Dexie.Table<IndexedModel, string>
  houseLayouts: Dexie.Table<IndexedLayout, string>
  vanillaModules: Dexie.Table<IndexedVanillaModule, string>
  vanillaColumns: Dexie.Table<IndexedVanillaColumn, string>
  altSectionTypeLayouts: Dexie.Table<IndexedAltSectionTypeLayouts, string>

  constructor() {
    super("LayoutsDatabase")
    this.version(1).stores({
      models: "speckleBranchUrl,systemId",
      houseLayouts: "[systemId+dnas]",
      vanillaModules: "[systemId+sectionType+positionType+levelType+gridType]",
      vanillaColumns: "[systemId+levelTypes]",
      altSectionTypeLayouts: "houseId",
    })
    this.houseLayouts = this.table("houseLayouts")
    this.models = this.table("models")
    this.vanillaModules = this.table("vanillaModules")
    this.vanillaColumns = this.table("vanillaColumns")
    this.altSectionTypeLayouts = this.table("altSectionTypeLayouts")
  }
}

// Create Dexie database
const layoutsDB = new LayoutsDatabase()

export default layoutsDB
