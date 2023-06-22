import { expose } from "comlink"
import Dexie, { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { BufferGeometry } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { vanillaTrpc } from "../../../client/trpc"
import { Block } from "../../../server/data/blocks"
import { Module } from "../../../server/data/modules"
import { getSpeckleObject } from "../../../server/data/speckleModel"
import { A, R } from "../../utils/functions"
import speckleIfcParser from "../../utils/speckle/speckleIfcParser"

type IndexedModule = Module & {
  lastFetched: string
}

type IndexedModel = {
  speckleBranchUrl: string
  lastFetched: string
  geometries: any
}

class SystemsDatabase extends Dexie {
  blocks: Dexie.Table<Block, string> // "string" is the type of the primary key
  modules: Dexie.Table<IndexedModule, string> // "string" is the type of the primary key
  models: Dexie.Table<IndexedModel, string>

  constructor() {
    super("SystemsDatabase")
    this.version(1).stores({
      blocks: "id,systemId,name",
      modules: "id,systemId,dna",
      models: "speckleBranchUrl",
    })
    this.blocks = this.table("blocks")
    this.modules = this.table("modules")
    this.models = this.table("models")
  }
}

// Create Dexie database
const db = new SystemsDatabase()

const initModules = async () => {
  const remoteModules = await vanillaTrpc.modules.query()

  const promises = remoteModules.map(async (remoteModule) => {
    const remoteDate = new Date(remoteModule.lastModified)
    const localModule = await db.modules.get(remoteModule.id)

    const indexedModule: IndexedModule = {
      ...remoteModule,
      lastFetched: new Date().toISOString(),
    } as any

    if (!localModule) {
      await db.modules.put(indexedModule)
      return
    }

    const localDate = new Date(localModule.lastModified)

    if (remoteDate > localDate) {
      await db.modules.put(indexedModule)
      return
    }
  })

  await Promise.all(promises)
}

const init = async () => {
  await initModules()
}

init()

const modulesObservable = liveQuery(() => db.modules.toArray())

modulesObservable.subscribe((modules) => {
  modules.map(async (nextModule) => {
    const { speckleBranchUrl, lastFetched } = nextModule
    const maybeModel = await db.models.get(speckleBranchUrl)

    if (
      maybeModel &&
      new Date(maybeModel.lastFetched) === new Date(lastFetched)
    ) {
      return
    }

    const speckleObjectData = await getSpeckleObject(speckleBranchUrl)
    const speckleObject = speckleIfcParser.parse(speckleObjectData)
    const geometries = pipe(
      speckleObject,
      A.reduce(
        {},
        (acc: { [e: string]: BufferGeometry[] }, { ifcTag, geometry }) => {
          return produce(acc, (draft) => {
            if (ifcTag in draft) draft[ifcTag].push(geometry)
            else draft[ifcTag] = [geometry]
          })
        }
      ),
      R.map((geoms) => mergeBufferGeometries(geoms)),
      R.filter((bg: BufferGeometry | null): bg is BufferGeometry =>
        Boolean(bg)
      ),
      R.map((x) => x.toJSON())
    )

    db.models.put({ speckleBranchUrl, lastFetched, geometries })
  })
})

const api = {}

export type SystemsAPI = typeof api

expose(api)
