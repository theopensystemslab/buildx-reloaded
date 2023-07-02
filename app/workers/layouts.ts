import { expose } from "comlink"
import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { BufferGeometry } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { Module } from "../../server/data/modules"
import { getSpeckleObject } from "../../server/data/speckleModel"
import layoutsDB, { LayoutsKey, serializeLayoutsKey } from "../db/layouts"
import systemsDB, { LastFetchStamped } from "../db/systems"
import { modulesToColumnLayout } from "../design/state/layouts"
import { A, R } from "../utils/functions"
import { isSSR } from "../utils/next"
import speckleIfcParser from "../utils/speckle/speckleIfcParser"

const syncModels = (modules: LastFetchStamped<Module>[]) => {
  modules.map(async (nextModule) => {
    const { speckleBranchUrl, lastFetched } = nextModule
    const maybeModel = await layoutsDB.models.get(speckleBranchUrl)

    if (maybeModel && maybeModel.lastFetched === lastFetched) {
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

    layoutsDB.models.put({
      speckleBranchUrl,
      lastFetched,
      geometries,
      systemId: nextModule.systemId,
    })
  })
}

let modulesCache: LastFetchStamped<Module>[] = []
let layoutsQueue: LayoutsKey[] = []

const processLayout = async ({ systemId, dnas }: LayoutsKey) => {
  const modules = pipe(
    dnas,
    A.filterMap((dna) =>
      pipe(
        modulesCache,
        A.findFirst(
          (systemModule: Module) =>
            systemModule.systemId === systemId && systemModule.dna === dna
        )
      )
    )
  )

  // modules to rows
  const layout = modulesToColumnLayout(modules)
  const layoutsKey = serializeLayoutsKey({ systemId, dnas })

  layoutsDB.layouts.put({
    layout,
    layoutsKey,
  })

  console.log({ layout })

  return layout
}

const processLayoutsQueue = async () => {
  if (modulesCache.length === 0) {
    return
  }

  // Process queue one item at a time
  while (layoutsQueue.length > 0) {
    const layoutsKey = layoutsQueue.shift()
    if (layoutsKey) {
      await processLayout(layoutsKey)
    }
  }
}

if (!isSSR()) {
  liveQuery(() => systemsDB.modules.toArray()).subscribe((modules) => {
    syncModels(modules)
    modulesCache = modules
    processLayoutsQueue()
  })
}

const postLayout = (key: LayoutsKey) => {
  layoutsQueue.push(key)
}

const postLayouts = (keys: LayoutsKey[]) => {
  keys.map(postLayout)
}

if (!isSSR()) {
  liveQuery(() => systemsDB.houseTypes.toArray()).subscribe((houseTypes) => {
    postLayouts(houseTypes)
    processLayoutsQueue()
  })
}

const api = {
  postLayout,
  postLayouts,
  processLayout,
}

export type LayoutsAPI = typeof api

expose(api)
