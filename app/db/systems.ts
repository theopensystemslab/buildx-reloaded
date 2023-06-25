import Dexie from "dexie"
import { Module } from "@/server/data/modules"
import { Block } from "@/server/data/blocks"

export type IndexedModule = Module & {
  lastFetched: string
}

export type IndexedModel = {
  speckleBranchUrl: string
  lastFetched: string
  geometries: any
}

class SystemsDatabase extends Dexie {
  blocks: Dexie.Table<Block, string> // "string" is the type of the primary key
  modules: Dexie.Table<IndexedModule, string> // "string" is the type of the primary key
  models: Dexie.Table<IndexedModel, string>

  constructor() {
    super("SystemsDatabase")
    this.version(1).stores({
      blocks: "id,systemId,name",
      modules: "id,systemId,dna",
      models: "speckleBranchUrl",
    })
    this.blocks = this.table("blocks")
    this.modules = this.table("modules")
    this.models = this.table("models")
  }
}

// Create Dexie database
const systemsDB = new SystemsDatabase()

export default systemsDB
