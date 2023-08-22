import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { BufferGeometry, BufferGeometryLoader, Group, Mesh } from "three"
import { Module } from "../../../../../server/data/modules"
import layoutsDB from "../../../../db/layouts"
import { O, R, S } from "../../../../utils/functions"
import { getMaterial } from "../systems"
import {
  ElementMeshUserData,
  ModuleGroupUserData,
  UserDataTypeEnum,
} from "../userData"

// speckle branch url : geometry by ifc tag
export let models: Record<string, Record<string, BufferGeometry>> = {}

export const getGeometry = ({
  speckleBranchUrl,
  ifcTag,
}: {
  speckleBranchUrl: string
  ifcTag: string
}) => models[speckleBranchUrl][ifcTag]

const loader = new BufferGeometryLoader()

const putModel = ({
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
      putModel({ speckleBranchUrl, geometries })
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
  const moduleGroup = new Group()

  const processModel = (
    modelGeometriesByIfcTag: Record<string, BufferGeometry>
  ) => {
    for (let ifcTag of Object.keys(modelGeometriesByIfcTag)) {
      const geometry = getGeometry({ speckleBranchUrl, ifcTag })
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
  }

  await pipe(
    models,
    R.lookup(speckleBranchUrl),
    O.match(
      async () => {
        const model = await layoutsDB.models.get(speckleBranchUrl)
        if (model === undefined)
          throw new Error(`no model for ${speckleBranchUrl}`)
        const loadedModel = putModel(model)
        processModel(loadedModel)
      },
      async (loadedModel) => {
        processModel(loadedModel)
      }
    )
  )

  const moduleGroupUserData: ModuleGroupUserData = {
    type: UserDataTypeEnum.Enum.ModuleGroup,
    gridGroupIndex,
    dna,
    length,
  }

  moduleGroup.userData = moduleGroupUserData

  return moduleGroup
}
