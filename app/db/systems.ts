import { Block } from "@/server/data/blocks"
import { Module } from "@/server/data/modules"
import Dexie from "dexie"

export type IndexedModule = Module & {
  lastFetched: string
}

class SystemsDatabase extends Dexie {
  blocks: Dexie.Table<Block, string> // "string" is the type of the primary key
  modules: Dexie.Table<IndexedModule, string> // "string" is the type of the primary key

  constructor() {
    super("SystemsDatabase")
    this.version(1).stores({
      blocks: "id,systemId,name",
      modules: "id,systemId,dna",
    })
    this.blocks = this.table("blocks")
    this.modules = this.table("modules")
  }
}

// Create Dexie database
const systemsDB = new SystemsDatabase()

export default systemsDB
