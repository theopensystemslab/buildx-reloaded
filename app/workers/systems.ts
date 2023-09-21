import { vanillaTrpc } from "../../client/trpc"
import { BlockModulesEntry } from "../../server/data/blockModulesEntries"
import { Block } from "../../server/data/blocks"
import { Element } from "../../server/data/elements"
import { EnergyInfo } from "../../server/data/energyInfos"
import { HouseType } from "../../server/data/houseTypes"
import { LevelType } from "../../server/data/levelTypes"
import { Material } from "../../server/data/materials"
import { Module } from "../../server/data/modules"
import { SectionType } from "../../server/data/sectionTypes"
import { SpaceType } from "../../server/data/spaceTypes"
import { WindowType } from "../../server/data/windowTypes"
import systemsDB, { LastFetchStamped } from "../db/systems"

const initModules = async () => {
  const remoteModules = await vanillaTrpc.modules.query()

  const promises = remoteModules.map(async (remoteModule) => {
    const localModule = await systemsDB.modules.get(remoteModule.id)

    const indexedModule: LastFetchStamped<Module> = {
      ...remoteModule,
      lastFetched: new Date().getTime(),
    } as any

    if (!localModule || remoteModule.lastModified > localModule.lastModified) {
      await systemsDB.modules.put(indexedModule)
    }
  })

  await Promise.all(promises)
}

const initHouseTypes = async () => {
  const remoteHouseTypes = await vanillaTrpc.houseTypes.query()

  const promises = remoteHouseTypes.map(async (remoteHouseType) => {
    const localHouseType = await systemsDB.houseTypes.get(remoteHouseType.id)

    const indexedHouseType: LastFetchStamped<HouseType> = {
      ...remoteHouseType,
      lastFetched: new Date().getTime(),
    }

    if (
      !localHouseType ||
      remoteHouseType.lastModified > localHouseType.lastModified
    ) {
      await systemsDB.houseTypes.put(indexedHouseType)
    }
  })

  await Promise.all(promises)
}

const initElements = async () => {
  const remoteElements = await vanillaTrpc.elements.query()

  const promises = remoteElements.map(async (remoteElement) => {
    const localElement = await systemsDB.elements.get(remoteElement.id)

    const indexedElement: LastFetchStamped<Element> = {
      ...remoteElement,
      lastFetched: new Date().getTime(),
    }

    if (
      !localElement ||
      remoteElement.lastModified > localElement.lastModified
    ) {
      await systemsDB.elements.put(indexedElement)
    }
  })

  await Promise.all(promises)
}

const initMaterials = async () => {
  const remoteMaterials = await vanillaTrpc.materials.query()

  const promises = remoteMaterials.map(async (remoteMaterial) => {
    const localElement = await systemsDB.materials.get(remoteMaterial.id)

    const indexedMaterial: LastFetchStamped<Material> = {
      ...remoteMaterial,
      lastFetched: new Date().getTime(),
    }

    if (
      !localElement ||
      remoteMaterial.lastModified > localElement.lastModified
    ) {
      await systemsDB.materials.put(indexedMaterial)
    }
  })

  await Promise.all(promises)
}

const initSectionTypes = async () => {
  const remoteSectionTypes = await vanillaTrpc.sectionTypes.query()

  const promises = remoteSectionTypes.map(async (remoteSectionType) => {
    const localSectionType = await systemsDB.sectionTypes.get(
      remoteSectionType.id
    )

    const indexedSectionType: LastFetchStamped<SectionType> = {
      ...remoteSectionType,
      lastFetched: new Date().getTime(),
    }

    if (
      !localSectionType ||
      remoteSectionType.lastModified > localSectionType.lastModified
    ) {
      await systemsDB.sectionTypes.put(indexedSectionType)
    }
  })

  await Promise.all(promises)
}

const initLevelTypes = async () => {
  const remoteLevelTypes = await vanillaTrpc.levelTypes.query()

  const promises = remoteLevelTypes.map(async (remoteLevelType) => {
    const localLevelType = await systemsDB.levelTypes.get(remoteLevelType.id)

    const indexedLevelType: LastFetchStamped<LevelType> = {
      ...remoteLevelType,
      lastFetched: new Date().getTime(),
    }

    if (
      !localLevelType ||
      remoteLevelType.lastModified > localLevelType.lastModified
    ) {
      await systemsDB.levelTypes.put(indexedLevelType)
    }
  })

  await Promise.all(promises)
}

const initWindowTypes = async () => {
  const remoteWindowTypes = await vanillaTrpc.windowTypes.query()

  const promises = remoteWindowTypes.map(async (remoteWindowType) => {
    const localWindowType = await systemsDB.windowTypes.get(remoteWindowType.id)

    const indexedWindowType: LastFetchStamped<WindowType> = {
      ...remoteWindowType,
      lastFetched: new Date().getTime(),
    }

    if (
      !localWindowType ||
      remoteWindowType.lastModified > localWindowType.lastModified
    ) {
      await systemsDB.windowTypes.put(indexedWindowType)
    }
  })

  await Promise.all(promises)
}

const initBlocks = async () => {
  const remoteBlocks = await vanillaTrpc.blocks.query()

  const promises = remoteBlocks.map(async (remoteBlock) => {
    const localBlock = await systemsDB.blocks.get(remoteBlock.id)

    const indexedBlock: LastFetchStamped<Block> = {
      ...remoteBlock,
      lastFetched: new Date().getTime(),
    }

    if (!localBlock || remoteBlock.lastModified > localBlock.lastModified) {
      await systemsDB.blocks.put(indexedBlock)
    }
  })

  await Promise.all(promises)
}

const initBlockModulesEntries = async () => {
  const remoteBlockModulesEntries =
    await vanillaTrpc.blockModulesEntries.query()

  const promises = remoteBlockModulesEntries.map(
    async (remoteBlockModulesEntry) => {
      const localBlockModulesEntry = await systemsDB.blockModuleEntries.get(
        remoteBlockModulesEntry.id
      )

      const indexedBlockModulesEntry: LastFetchStamped<BlockModulesEntry> = {
        ...remoteBlockModulesEntry,
        lastFetched: new Date().getTime(),
      }

      if (
        !localBlockModulesEntry ||
        remoteBlockModulesEntry.lastModified >
          localBlockModulesEntry.lastModified
      ) {
        await systemsDB.blockModuleEntries.put(indexedBlockModulesEntry)
      }
    }
  )

  await Promise.all(promises)
}

const initSpaceTypes = async () => {
  const remoteSpaceTypes = await vanillaTrpc.spaceTypes.query()

  const promises = remoteSpaceTypes.map(async (remoteSpaceType) => {
    const localSpaceType = await systemsDB.spaceTypes.get(remoteSpaceType.id)

    const indexedSpaceType: LastFetchStamped<SpaceType> = {
      ...remoteSpaceType,
      lastFetched: new Date().getTime(),
    }

    if (
      !localSpaceType ||
      remoteSpaceType.lastModified > localSpaceType.lastModified
    ) {
      await systemsDB.spaceTypes.put(indexedSpaceType)
    }
  })

  await Promise.all(promises)
}

const initEnergyInfos = async () => {
  const remoteEnergyInfos = await vanillaTrpc.energyInfos.query()

  const promises = remoteEnergyInfos.map(async (remoteEnergyInfo) => {
    const localEnergyInfo = await systemsDB.energyInfos.get(remoteEnergyInfo.id)

    const indexedEnergyInfo: LastFetchStamped<EnergyInfo> = {
      ...remoteEnergyInfo,
      lastFetched: new Date().getTime(),
    }

    if (
      !localEnergyInfo ||
      remoteEnergyInfo.lastModified > localEnergyInfo.lastModified
    ) {
      await systemsDB.energyInfos.put(indexedEnergyInfo)
    }
  })

  await Promise.all(promises)
}
const init = () => {
  initModules()
  initHouseTypes()
  initElements()
  initMaterials()
  initSectionTypes()
  initLevelTypes()
  initWindowTypes()
  initBlocks()
  initBlockModulesEntries()
  initSpaceTypes()
  initEnergyInfos()
}

init()
