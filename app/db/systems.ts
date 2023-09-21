import { Block } from "@/server/data/blocks"
import { Module } from "@/server/data/modules"
import Dexie from "dexie"
import { useLiveQuery } from "dexie-react-hooks"
import { BlockModulesEntry } from "../../server/data/blockModulesEntries"
import { Element } from "../../server/data/elements"
import { EnergyInfo } from "../../server/data/energyInfos"
import { HouseType } from "../../server/data/houseTypes"
import { LevelType } from "../../server/data/levelTypes"
import { Material } from "../../server/data/materials"
import { SectionType } from "../../server/data/sectionTypes"
import { SpaceType } from "../../server/data/spaceTypes"
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
  blockModuleEntries: Dexie.Table<BlockModulesEntry, string>
  spaceTypes: Dexie.Table<SpaceType, string>
  energyInfos: Dexie.Table<EnergyInfo, string>

  constructor() {
    super("SystemsDatabase")
    this.version(1).stores({
      modules: "[systemId+dna]",
      houseTypes: "id",
      elements: "[systemId+ifcTag]",
      materials: "id",
      sectionTypes: "id",
      levelTypes: "[systemId+code]",
      windowTypes: "id",
      blocks: "[systemId+name]",
      blockModuleEntries: "id",
      spaceTypes: "id",
      energyInfos: "id",
    })
    this.modules = this.table("modules")
    this.houseTypes = this.table("houseTypes")
    this.elements = this.table("elements")
    this.materials = this.table("materials")
    this.sectionTypes = this.table("sectionTypes")
    this.levelTypes = this.table("levelTypes")
    this.windowTypes = this.table("windowTypes")
    this.blocks = this.table("blocks")
    this.blockModuleEntries = this.table("blockModuleEntries")
    this.spaceTypes = this.table("spaceTypes")
    this.energyInfos = this.table("energyInfos")
  }
}

// Create Dexie database
const systemsDB = new SystemsDatabase()

export const useAllModules = (): LastFetchStamped<Module>[] =>
  useLiveQuery(() => systemsDB.modules.toArray(), [], [])

export const useAllBlocks = (): Block[] =>
  useLiveQuery(() => systemsDB.blocks.toArray(), [], [])

export const useAllBlockModulesEntries = (): BlockModulesEntry[] =>
  useLiveQuery(() => systemsDB.blockModuleEntries.toArray(), [], [])

export const useSystemModules = (
  systemId: string
): LastFetchStamped<Module>[] =>
  useAllModules().filter((x) => x.systemId === systemId)

export const useAllSpaceTypes = (): SpaceType[] =>
  useLiveQuery(() => systemsDB.spaceTypes.toArray(), [], [])

export const useAllWindowTypes = (): WindowType[] =>
  useLiveQuery(() => systemsDB.windowTypes.toArray(), [], [])

export const useAllMaterials = (): Material[] =>
  useLiveQuery(() => systemsDB.materials.toArray(), [], [])

export const useAllElements = (): Element[] =>
  useLiveQuery(() => systemsDB.elements.toArray(), [], [])

export const useAllEnergyInfos = (): EnergyInfo[] =>
  useLiveQuery(() => systemsDB.energyInfos.toArray(), [], [])

export default systemsDB
