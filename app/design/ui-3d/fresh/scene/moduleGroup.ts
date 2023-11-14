import { liveQuery } from "dexie"
import { flow, pipe } from "fp-ts/lib/function"
import { BufferGeometry, BufferGeometryLoader, Group, Mesh } from "three"
import { Module } from "../../../../../server/data/modules"
import layoutsDB from "../../../../db/layouts"
import { A, O, R, S, someOrError, T } from "../../../../utils/functions"
import {
  setInvisibleNoRaycast,
  setVisibleAndRaycast,
} from "../../../../utils/three"
import { getModelsWorker } from "../../../../workers"
import { getSystemElement } from "../systems"
import {
  ElementMeshUserData,
  HouseTransformsGroup,
  isModuleGroup,
  ModuleGroup,
  ModuleGroupUse,
  ModuleGroupUserData,
  UserDataTypeEnum,
} from "./userData"
import { Element } from "../../../../../server/data/elements"

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
  use,
  visible,
  flip,
  z,
  houseTransformsGroup,
}: {
  systemId: string
  houseId: string
  gridGroupIndex: number
  module: Module
  use: ModuleGroupUse
  visible: boolean
  flip: boolean
  z: number
  houseTransformsGroup: HouseTransformsGroup
}) => {
  const moduleGroup = new Group() as ModuleGroup

  moduleGroup.scale.set(1, 1, flip ? 1 : -1)
  moduleGroup.position.set(0, 0, flip ? z + length / 2 : z - length / 2)

  const modelGeometries = await getModelGeometriesTask({
    systemId,
    speckleBranchUrl,
  })()

  const { elements, pushElement } = houseTransformsGroup.userData

  for (let ifcTag of Object.keys(modelGeometries)) {
    const geometry = getGeometry({
      speckleBranchUrl,
      ifcTag,
    })

    const element = pipe(
      elements,
      R.lookup(ifcTag),
      O.getOrElse(() => getSystemElement({ systemId, ifcTag }) as Element)
    )

    // const { threeMaterial } = materials[activeElementMaterials[ifcTag]]
    const threeMaterial = pushElement(element)

    // threeMaterial.wireframe = false

    const mesh = new Mesh(geometry, threeMaterial)
    mesh.castShadow = true

    const elementMeshUserData: ElementMeshUserData = {
      type: UserDataTypeEnum.Enum.ElementMesh,
      ifcTag,
      category: element.category,
    }
    mesh.userData = elementMeshUserData
    moduleGroup.add(mesh)
  }

  const setThisModuleGroupVisible = () => {
    pipe(
      moduleGroup.parent!.children,
      A.filter(
        (x): x is ModuleGroup =>
          isModuleGroup(x) &&
          x.userData.gridGroupIndex === moduleGroup.userData.gridGroupIndex &&
          x.visible
      ),
      A.map((moduleGroup) => {
        setInvisibleNoRaycast(moduleGroup)
      })
    )

    setVisibleAndRaycast(moduleGroup)
  }

  const moduleGroupUserData: ModuleGroupUserData = {
    type: UserDataTypeEnum.Enum.ModuleGroup,
    gridGroupIndex,
    dna,
    length,
    use,
    z,
    setThisModuleGroupVisible,
  }

  moduleGroup.userData = moduleGroupUserData

  if (visible) setVisibleAndRaycast(moduleGroup)
  else setInvisibleNoRaycast(moduleGroup)

  return moduleGroup
}
