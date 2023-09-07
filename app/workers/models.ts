import { Module } from "../../server/data/modules"
import layoutsDB from "../db/layouts"
import systemsDB, { LastFetchStamped } from "../db/systems"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { BufferGeometry } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { getSpeckleObject } from "../../server/data/speckleModel"
import { A, R } from "../utils/functions"
import speckleIfcParser from "../utils/speckle/speckleIfcParser"
import { expose } from "comlink"
import { isSSR } from "../utils/next"
import { liveQuery } from "dexie"

const getSpeckleModelGeometries = async (speckleBranchUrl: string) => {
  const speckleObjectData = await getSpeckleObject(speckleBranchUrl)
  const speckleObject = speckleIfcParser.parse(speckleObjectData)

  return pipe(
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
    R.filter((bg: BufferGeometry | null): bg is BufferGeometry => Boolean(bg)),
    R.map((x) => x.toJSON())
  )
}

const putModuleModel = async ({
  systemId,
  lastFetched,
  speckleBranchUrl,
}: Pick<
  LastFetchStamped<Module>,
  "systemId" | "lastFetched" | "speckleBranchUrl"
>) => {
  const geometries = await getSpeckleModelGeometries(speckleBranchUrl)

  const payload = {
    speckleBranchUrl,
    lastFetched,
    geometries,
    systemId,
  }

  layoutsDB.models.put(payload)

  return payload
}

const getModuleModel = async ({
  speckleBranchUrl,
  systemId,
}: {
  speckleBranchUrl: string
  systemId: string
}) => {
  const maybeModuleModel = await layoutsDB.models.get(speckleBranchUrl)
  if (maybeModuleModel) return maybeModuleModel
  return await putModuleModel({
    systemId,
    speckleBranchUrl,
    lastFetched: new Date().getTime(),
  })
}

if (!isSSR()) {
  liveQuery(() => systemsDB.modules.toArray()).subscribe(async (modules) => {
    for (const { systemId, speckleBranchUrl } of modules) {
      getModuleModel({
        systemId,
        speckleBranchUrl,
      })
    }
  })
}

export const syncModuleModels = (modules: LastFetchStamped<Module>[]) => {
  modules.map(async (nextModule) => {
    const { speckleBranchUrl, lastFetched } = nextModule
    const maybeModel = await layoutsDB.models.get(speckleBranchUrl)

    if (maybeModel && maybeModel.lastFetched === lastFetched) {
      return
    }

    const geometries = await getSpeckleModelGeometries(speckleBranchUrl)

    layoutsDB.models.put({
      speckleBranchUrl,
      lastFetched,
      geometries,
      systemId: nextModule.systemId,
    })
  })
}

if (!isSSR()) {
  liveQuery(() => systemsDB.modules.toArray()).subscribe((modules) => {
    syncModuleModels(modules)
    // modulesCache = modules
    // processLayoutsQueue()
  })
}

const api = {
  syncModuleModels,
  putModuleModel,
  getModuleModel,
}

export type ModelsAPI = typeof api

expose(api)
