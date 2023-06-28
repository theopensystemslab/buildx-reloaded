import { vanillaTrpc } from "../../client/trpc"
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

    if (!localModule) {
      await systemsDB.modules.put(indexedModule)
      return
    }

    if (remoteModule.lastModified > localModule.lastModified) {
      await systemsDB.modules.put(indexedModule)
      return
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

    if (!localHouseType) {
      await systemsDB.houseTypes.put(indexedHouseType)
      return
    }

    if (remoteHouseType.lastModified > localHouseType.lastModified) {
      await systemsDB.houseTypes.put(indexedHouseType)
      return
    }
  })

  await Promise.all(promises)
}

const init = () => {
  initModules()
  initHouseTypes()
}

init()
