import { expose } from "comlink"
import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { BufferGeometry } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { ComputeLayoutEventDetail } from "."
import { vanillaTrpc } from "../../../client/trpc"
import { Module } from "../../../server/data/modules"
import { getSpeckleObject } from "../../../server/data/speckleModel"
import systemsDB, { IndexedModule } from "../../db/systems"
import { modulesToColumnLayout } from "../../design/state/layouts"
import { A, R } from "../../utils/functions"
import speckleIfcParser from "../../utils/speckle/speckleIfcParser"

const initModules = async () => {
  const remoteModules = await vanillaTrpc.modules.query()

  const promises = remoteModules.map(async (remoteModule) => {
    const remoteDate = new Date(remoteModule.lastModified)
    const localModule = await systemsDB.modules.get(remoteModule.id)

    const indexedModule: IndexedModule = {
      ...remoteModule,
      lastFetched: new Date().toISOString(),
    } as any

    if (!localModule) {
      await systemsDB.modules.put(indexedModule)
      return
    }

    const localDate = new Date(localModule.lastModified)

    if (remoteDate > localDate) {
      await systemsDB.modules.put(indexedModule)
      return
    }
  })

  await Promise.all(promises)
}

const init = async () => {
  await initModules()
}

init()

const modulesObservable = liveQuery(() => systemsDB.modules.toArray())

let allSystemsModules: Module[] = []

modulesObservable.subscribe((modules) => {
  allSystemsModules = modules

  modules.map(async (nextModule) => {
    const { speckleBranchUrl, lastFetched } = nextModule
    const maybeModel = await systemsDB.models.get(speckleBranchUrl)

    if (
      maybeModel &&
      new Date(maybeModel.lastFetched).getTime() ===
        new Date(lastFetched).getTime()
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

    systemsDB.models.put({ speckleBranchUrl, lastFetched, geometries })
  })
})

export const getLayout = ({ systemId, dnas }: ComputeLayoutEventDetail) => {
  // TODO: cache in the db!

  // dnas to modules array
  const modules = pipe(
    dnas,
    A.filterMap((dna) =>
      pipe(
        allSystemsModules,
        A.findFirst(
          (systemModule: Module) =>
            systemModule.systemId === systemId && systemModule.dna === dna
        )
      )
    )
  )

  // modules to rows
  const columnLayout = modulesToColumnLayout(modules)

  return columnLayout
}

const api = {
  getLayout: getLayout,
}

export type SystemsAPI = typeof api

expose(api)
