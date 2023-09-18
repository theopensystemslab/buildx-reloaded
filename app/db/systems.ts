import { Block } from "@/server/data/blocks"
import { Module } from "@/server/data/modules"
import Dexie from "dexie"
import { Element } from "../../server/data/elements"
import { HouseType } from "../../server/data/houseTypes"
import { LevelType } from "../../server/data/levelTypes"
import { Material } from "../../server/data/materials"
import { SectionType } from "../../server/data/sectionTypes"
import { WindowType } from "../../server/data/windowTypes"

export type LastFetchStamped<T> = T & {
  lastFetched: number
}

class SystemsDatabase extends Dexie {
  modules: Dexie.Table<LastFetchStamped<Module>, string>
  houseTypes: Dexie.Table<LastFetchStamped<HouseType>, string>
  elements: Dexie.Table<LastFetchStamped<Element>, string>
  materials: Dexie.Table<LastFetchStamped<Material>, string>
  sectionTypes: Dexie.Table<LastFetchStamped<SectionType>, string>
  levelTypes: Dexie.Table<LastFetchStamped<LevelType>, string>
  windowTypes: Dexie.Table<LastFetchStamped<WindowType>, string>
  blocks: Dexie.Table<Block, string>

  constructor() {
    super("SystemsDatabase")
    this.version(1).stores({
      blocks: "[systemId+name]",
      modules: "[systemId+dna]",
      houseTypes: "id",
      elements: "[systemId+ifcTag]",
      materials: "id",
      sectionTypes: "id",
      levelTypes: "[systemId+code]",
      windowTypes: "id",
    })
    this.modules = this.table("modules")
    this.houseTypes = this.table("houseTypes")
    this.blocks = this.table("blocks")
    this.elements = this.table("elements")
    this.materials = this.table("materials")
    this.sectionTypes = this.table("sectionTypes")
    this.levelTypes = this.table("levelTypes")
    this.windowTypes = this.table("windowTypes")
  }
}

// Create Dexie database
const systemsDB = new SystemsDatabase()

export default systemsDB
