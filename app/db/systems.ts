import { Block } from "@/server/data/blocks"
import { Module } from "@/server/data/modules"
import Dexie from "dexie"
import { Element } from "../../server/data/elements"
import { HouseType } from "../../server/data/houseTypes"

export type LastFetchStamped<T> = T & {
  lastFetched: number
}

class SystemsDatabase extends Dexie {
  modules: Dexie.Table<LastFetchStamped<Module>, string>
  houseTypes: Dexie.Table<LastFetchStamped<HouseType>, string>
  elements: Dexie.Table<LastFetchStamped<Element>, string>
  blocks: Dexie.Table<Block, string>

  constructor() {
    super("SystemsDatabase")
    this.version(1).stores({
      blocks: "id,systemId,name",
      modules: "id,systemId,dna",
      houseTypes: "id,systemId",
      elements: "id,systemId",
    })
    this.modules = this.table("modules")
    this.houseTypes = this.table("houseTypes")
    this.blocks = this.table("blocks")
    this.elements = this.table("elements")
  }
}

// Create Dexie database
const systemsDB = new SystemsDatabase()

export default systemsDB
