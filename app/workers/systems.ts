import { vanillaTrpc } from "../../client/trpc"
import { Element } from "../../server/data/elements"
import { HouseType } from "../../server/data/houseTypes"
import { Module } from "../../server/data/modules"
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

const init = () => {
  initModules()
  initHouseTypes()
  initElements()
}

init()
