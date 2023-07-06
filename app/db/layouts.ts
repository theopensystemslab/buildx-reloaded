import Dexie from "dexie"
import { ColumnLayout, PositionedColumn } from "../workers/layouts"
import { LastFetchStamped } from "./systems"

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

export type VanillaColumn = Omit<PositionedColumn, "z" | "columnIndex">

export type IndexedVanillaColumn = {
  layoutsKey: string
  vanillaColumn: VanillaColumn
}

export const serializeLayoutKey = ({ systemId, dnas }: LayoutKey) =>
  `${systemId}:${dnas}`

class LayoutsDatabase extends Dexie {
  models: Dexie.Table<LastFetchStamped<ParsedModel>, string>
  layouts: Dexie.Table<IndexedLayout, string>
  vanillaColumns: Dexie.Table<IndexedVanillaColumn, string>

  constructor() {
    super("LayoutsDatabase")
    this.version(1).stores({
      models: "speckleBranchUrl,systemId",
      layouts: "layoutsKey",
      vanillaColumns: "layoutsKey",
    })
    this.layouts = this.table("layouts")
    this.models = this.table("models")
    this.vanillaColumns = this.table("vanillaColumns")
  }
}

// Create Dexie database
const layoutsDB = new LayoutsDatabase()

export default layoutsDB
