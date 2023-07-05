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

export type LayoutsKey = {
  systemId: string
  dnas: string[]
}

export type IndexedVanillaColumn = {
  layoutsKey: string
  vanillaColumn: Omit<PositionedColumn, "z" | "columnIndex">
}

export const serializeLayoutsKey = ({ systemId, dnas }: LayoutsKey) =>
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
