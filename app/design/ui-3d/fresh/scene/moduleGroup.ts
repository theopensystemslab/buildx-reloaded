import { liveQuery } from "dexie"
import { flow, pipe } from "fp-ts/lib/function"
import { BufferGeometry, BufferGeometryLoader, Group, Mesh } from "three"
import { Module } from "../../../../../server/data/modules"
import layoutsDB from "../../../../db/layouts"
import { LastFetchStamped } from "../../../../db/systems"
import { O, R, S, someOrError, T } from "../../../../utils/functions"
import { getModelsWorker } from "../../../../workers"
import { getMaterial } from "../systems"
import {
  ElementMeshUserData,
  ModuleGroup,
  ModuleGroupUserData,
  UserDataTypeEnum,
} from "./userData"

// speckle branch url : geometry by ifc tag
export let models: Record<string, Record<string, BufferGeometry>> = {}

export const getModelGeometriesTask = ({
  systemId,
  speckleBranchUrl,
}: {
  systemId: string
  speckleBranchUrl: string
}): T.Task<Record<string, BufferGeometry>> => {
  const onNoModel = (): T.Task<Record<string, BufferGeometry>> => async () => {
    const { geometries } = await getModelsWorker().getModuleModel({
      systemId,
      speckleBranchUrl,
    })
    const loadedModels: Record<string, BufferGeometry> = pipe(
      geometries,
      R.map((x) => loader.parse(x) as BufferGeometry),
      R.reduceWithIndex(S.Ord)({}, (ifcTag, acc, geometry) => {
        geometry.computeVertexNormals()
        return {
          ...acc,
          [ifcTag]: geometry,
        }
      })
    )

    models[speckleBranchUrl] = loadedModels
    return loadedModels
  }

  return pipe(
    models,
    R.lookup(speckleBranchUrl),
    O.match(onNoModel, flow(T.of))
  )
}

export const getGeometry = ({
  speckleBranchUrl,
  ifcTag,
}: // systemId,
// lastFetched,
{
  speckleBranchUrl: string
  ifcTag: string
  // systemId: string
  // lastFetched: number
}): BufferGeometry => {
  // const onNoModelGeometries = (): T.Task<BufferGeometry> => () =>
  //   getModelsWorker()
  //     .putModuleModel({
  //       systemId,
  //       speckleBranchUrl,
  //       lastFetched,
  //     })
  //     .then(({ geometries }) => {
  //       const loadedModels: Record<string, BufferGeometry> = pipe(
  //         geometries,
  //         R.map((x) => loader.parse(x) as BufferGeometry),
  //         R.reduceWithIndex(S.Ord)({}, (ifcTag, acc, geometry) => {
  //           geometry.computeVertexNormals()
  //           return {
  //             ...acc,
  //             [ifcTag]: geometry,
  //           }
  //         })
  //       )
  //       models[speckleBranchUrl] = loadedModels

  //       return pipe(
  //         models,
  //         R.lookup(speckleBranchUrl),
  //         O.chain(R.lookup(ifcTag)),
  //         someOrError(`onNoModelGeometries error`)
  //       )
  //     })

  return pipe(
    models,
    R.lookup(speckleBranchUrl),
    O.chain(R.lookup(ifcTag)),
    someOrError(`no geometry found for ${ifcTag} in ${speckleBranchUrl}`)
  )
}

const loader = new BufferGeometryLoader()

const cacheModel = ({
  geometries,
  speckleBranchUrl,
}: {
  speckleBranchUrl: string
  geometries: any
}) => {
  const loadedModels: Record<string, BufferGeometry> = pipe(
    geometries,
    R.map((x) => loader.parse(x) as BufferGeometry),
    R.reduceWithIndex(S.Ord)({}, (ifcTag, acc, geometry) => {
      geometry.computeVertexNormals()
      return {
        ...acc,
        [ifcTag]: geometry,
      }
    })
  )
  models[speckleBranchUrl] = loadedModels

  return loadedModels
}

liveQuery(() => layoutsDB.models.toArray()).subscribe((dbModels) => {
  for (let { speckleBranchUrl, geometries } of dbModels) {
    if (!(speckleBranchUrl in models)) {
      cacheModel({ speckleBranchUrl, geometries })
    }
  }
})

export const createModuleGroup = async ({
  systemId,
  houseId,
  gridGroupIndex,
  module: { speckleBranchUrl, length, dna },
}: {
  systemId: string
  houseId: string
  gridGroupIndex: number
  module: Module
}) => {
  const moduleGroup = new Group() as ModuleGroup

  const modelGeometries = await getModelGeometriesTask({
    systemId,
    speckleBranchUrl,
  })()

  for (let ifcTag of Object.keys(modelGeometries)) {
    const geometry = getGeometry({
      speckleBranchUrl,
      ifcTag,
      // systemId,
      // lastFetched,
    })
    const material = getMaterial({
      systemId,
      ifcTag,
      houseId,
    })
    material.wireframe = false
    const mesh = new Mesh(geometry, material)
    mesh.castShadow = true

    const elementMeshUserData: ElementMeshUserData = {
      type: UserDataTypeEnum.Enum.ElementMesh,
      ifcTag,
    }
    mesh.userData = elementMeshUserData
    moduleGroup.add(mesh)
  }

  const moduleGroupUserData: ModuleGroupUserData = {
    type: UserDataTypeEnum.Enum.ModuleGroup,
    gridGroupIndex,
    dna,
    length,
  }

  moduleGroup.userData = moduleGroupUserData

  return moduleGroup
}
