import { expose } from "comlink"
import Dexie, { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { vanillaTrpc } from "../../../client/trpc"
import { Block } from "../../../server/data/blocks"
import { Module } from "../../../server/data/modules"

class SystemsDatabase extends Dexie {
  blocks: Dexie.Table<Block, string> // "string" is the type of the primary key
  modules: Dexie.Table<Module, string> // "string" is the type of the primary key

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
const db = new SystemsDatabase()

const initModules = async () => {
  const remoteModules = await vanillaTrpc.modules.query()

  const promises = remoteModules.map(async (remoteModule) => {
    const remoteDate = new Date(remoteModule.lastModified)
    const localModule = await db.modules.get(remoteModule.id)

    if (!localModule) {
      await db.modules.put(remoteModule as Module)
      return
    }

    const localDate = new Date(localModule.lastModified)

    if (remoteDate > localDate) {
      await db.modules.put(remoteModule as Module)
      return
    }
  })

  await Promise.all(promises)
}

const init = async () => {
  await initModules()
}

init()

const getBlocks = async (systemIds: string[] = []) => {
  console.log("getBlocks")
  if (systemIds.length === 0) {
    return []
  } else {
    return db.blocks.toArray()
  }
}

const modulesObservable = liveQuery(() => db.modules.toArray())

const api = {
  getBlocks,
  modulesObservable,
}

export type SystemsAPI = typeof api

expose(api)
