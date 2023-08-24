import { Module } from "../../../server/data/modules"
import layoutsDB from "../../db/layouts"
import { LastFetchStamped } from "../../db/systems"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { BufferGeometry } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { getSpeckleObject } from "../../../server/data/speckleModel"
import { A, R } from "../../utils/functions"
import speckleIfcParser from "../../utils/speckle/speckleIfcParser"

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

export const syncModels = (modules: LastFetchStamped<Module>[]) => {
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
