import Dexie from "dexie"
import { ColumnLayout } from "../design/state/layouts"
import { LastFetchStamped } from "./systems"

export type ParsedModel = {
  speckleBranchUrl: string
  geometries: any
}

export type IndexedLayout = {
  layoutsKey: string
  layout: ColumnLayout
}

export type LayoutsKey = {
  systemId: string
  dnas: string[]
}

export const serializeLayoutsKey = ({ systemId, dnas }: LayoutsKey) =>
  `${systemId}:${dnas}`

class LayoutsDatabase extends Dexie {
  models: Dexie.Table<LastFetchStamped<ParsedModel>, string>
  layouts: Dexie.Table<IndexedLayout, string>

  constructor() {
    super("LayoutsDatabase")
    this.version(1).stores({
      models: "speckleBranchUrl",
      layouts: "layoutsKey",
    })
    this.layouts = this.table("layouts")
    this.models = this.table("models")
  }
}

// Create Dexie database
const layoutsDB = new LayoutsDatabase()

export default layoutsDB
