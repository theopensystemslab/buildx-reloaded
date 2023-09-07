import { Module } from "../../../server/data/modules"
import systemsDB, { LastFetchStamped } from "../../db/systems"

let modulesCache: LastFetchStamped<Module>[] = []

export const getModules = async () => {
  if (modulesCache.length > 0) return modulesCache
  modulesCache = await systemsDB.modules.toArray()
  return modulesCache
}
