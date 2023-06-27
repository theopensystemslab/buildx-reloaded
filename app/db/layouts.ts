import Dexie from "dexie"
import { ColumnLayout } from "../design/state/layouts"

export type IndexedModel = {
  speckleBranchUrl: string
  lastFetched: string
  geometries: any
}

class LayoutsDatabase extends Dexie {
  models: Dexie.Table<IndexedModel, string>
  layouts: Dexie.Table<ColumnLayout, string>

  constructor() {
    super("LayoutsDatabase")
    this.version(1).stores({
      models: "speckleBranchUrl",
      layouts: "systemIdDnas",
    })
    this.layouts = this.table("layouts")
    this.models = this.table("models")
  }
}

// Create Dexie database
const layoutsDB = new LayoutsDatabase()

export default layoutsDB
