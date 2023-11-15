"use client"
import { Block } from "@/server/data/blocks"
import { Module } from "@/server/data/modules"
import Dexie from "dexie"
import { useLiveQuery } from "dexie-react-hooks"
import { pipe } from "fp-ts/lib/function"
import { BlockModulesEntry } from "../../server/data/blockModulesEntries"
import { Element } from "../../server/data/elements"
import { EnergyInfo } from "../../server/data/energyInfos"
import { HouseType } from "../../server/data/houseTypes"
import { LevelType } from "../../server/data/levelTypes"
import { Material } from "../../server/data/materials"
import { SectionType } from "../../server/data/sectionTypes"
import { SystemSettings } from "../../server/data/settings"
import { SpaceType } from "../../server/data/spaceTypes"
import { WindowType } from "../../server/data/windowTypes"
import { A } from "../utils/functions"
import { useEffect } from "react"

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
  settings: Dexie.Table<SystemSettings, string>

  constructor() {
    super("SystemsDatabase")
    this.version(1).stores({
      modules: "[systemId+dna]",
      houseTypes: "id",
      elements: "[systemId+ifcTag]",
      materials: "id",
      sectionTypes: "id",
      levelTypes: "[systemId+code]",
      windowTypes: "[systemId+code]",
      blocks: "[systemId+name]",
      blockModuleEntries: "id",
      spaceTypes: "id",
      energyInfos: "id",
      settings: "systemId",
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
    this.settings = this.table("settings")
  }
}

// Create Dexie database
const systemsDB = new SystemsDatabase()

export const useAllHouseTypes = (): LastFetchStamped<HouseType>[] => {
  const houseTypes = useLiveQuery(() => systemsDB.houseTypes.toArray(), [], [])

  useEffect(() => {
    houseTypes.forEach((houseType) => {
      if (houseType.imageUrl) {
        const img = new Image()
        img.src = houseType.imageUrl
      }
    })
  }, [houseTypes])

  return houseTypes
}

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

export const useAllWindowTypes = (): WindowType[] => {
  const windowTypes = useLiveQuery(
    () => systemsDB.windowTypes.toArray(),
    [],
    []
  )

  useEffect(() => {
    windowTypes.forEach((windowType) => {
      if (windowType.imageUrl) {
        const img = new Image()
        img.src = windowType.imageUrl
      }
    })
  }, [windowTypes])

  return windowTypes
}

export const useAllLevelTypes = (): LevelType[] =>
  useLiveQuery(() => systemsDB.levelTypes.toArray(), [], [])

export const useAllMaterials = (): Material[] => {
  const materials = useLiveQuery(() => systemsDB.materials.toArray(), [], [])

  useEffect(() => {
    materials.forEach((material) => {
      if (material.imageUrl) {
        const img = new Image()
        img.src = material.imageUrl
      }
    })
  }, [materials])

  return materials
}

export const useAllElements = (): Element[] =>
  useLiveQuery(() => systemsDB.elements.toArray(), [], [])

export const useAllEnergyInfos = (): EnergyInfo[] =>
  useLiveQuery(() => systemsDB.energyInfos.toArray(), [], [])

export const useAllSystemSettings = (): SystemSettings[] =>
  useLiveQuery(() => systemsDB.settings.toArray(), [], [])

export const useGetSystemSettings = () => {
  const allSystemSettings = useAllSystemSettings()

  return (systemId: string) =>
    pipe(
      allSystemSettings,
      A.findFirst((x) => x.systemId === systemId)
    )
}

export default systemsDB
