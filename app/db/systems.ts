import { Block } from "@/server/data/blocks"
import { Module } from "@/server/data/modules"
import Dexie from "dexie"
import { Element } from "../../server/data/elements"
import { HouseType } from "../../server/data/houseTypes"
import { LevelType } from "../../server/data/levelTypes"
import { SectionType } from "../../server/data/sectionTypes"

export type LastFetchStamped<T> = T & {
  lastFetched: number
}

class SystemsDatabase extends Dexie {
  modules: Dexie.Table<LastFetchStamped<Module>, string>
  houseTypes: Dexie.Table<LastFetchStamped<HouseType>, string>
  elements: Dexie.Table<LastFetchStamped<Element>, string>
  sectionTypes: Dexie.Table<LastFetchStamped<SectionType>, string>
  levelTypes: Dexie.Table<LastFetchStamped<LevelType>, string>
  blocks: Dexie.Table<Block, string>

  constructor() {
    super("SystemsDatabase")
    this.version(1).stores({
      blocks: "id,systemId,name",
      modules: "id,systemId,dna",
      houseTypes: "id,systemId",
      elements: "id,systemId",
      sectionTypes: "id,systemId",
      levelTypes: "id,systemId",
    })
    this.modules = this.table("modules")
    this.houseTypes = this.table("houseTypes")
    this.blocks = this.table("blocks")
    this.elements = this.table("elements")
    this.sectionTypes = this.table("sectionTypes")
    this.levelTypes = this.table("levelTypes")
  }
}

// Create Dexie database
const systemsDB = new SystemsDatabase()

export default systemsDB
