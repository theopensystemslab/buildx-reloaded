import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh"
import { proxy, ref } from "valtio"
import { proxyMap } from "valtio/utils"
import { IFCLoader } from "web-ifc-three"
import { IfcModel } from "web-ifc-three/IFC/BaseDefinitions"
import { Subset } from "web-ifc-three/IFC/components/subsets/SubsetManager"

// { modelUrl : IfcModel }
export const models = proxyMap<string, IfcModel>()

export const getSubsetKey = () => {}

// { ??? : Subset }
export const subsets = proxyMap<string, Subset>()

function getIfcLoader() {
  const loader = new IFCLoader()
  loader.ifcManager.setWasmPath("../../../wasm/")
  loader.ifcManager.setupThreeMeshBVH(
    computeBoundsTree,
    disposeBoundsTree,
    acceleratedRaycast
  )
  return loader
}

const ifc = proxy({
  models,
  subsets,
  loader: ref(getIfcLoader()),
})

export const loadIfcModel = async (ifcModelUrl: string) => {
  const maybeModel = models.get(ifcModelUrl)
  if (maybeModel) return

  const model: IfcModel = await ifc.loader.loadAsync(ifcModelUrl)
  models.set(ifcModelUrl, ref(model))
}

export default ifc

// export const useModel = (modelUrl: string) =>
//   suspend(
//     async (...keys) => {
//       const [modelUrl] = keys
//       const maybeModel = models.get(modelUrl)
//       if (maybeModel) return maybeModel

//       const model: IfcModel = await ifc.loader.loadAsync(modelUrl)
//       models.set(modelUrl, ref(model))

//       console.log(model.modelID)
//       const ifcProject = await ifc.loader.ifcManager.getSpatialStructure(
//         model.modelID,
//         true
//       )
//       console.log(ifcProject)

//       return model
//     },
//     [modelUrl]
//   )

// export const useSubset = (modelUrl: string) => {
//   // need to divvy up the model by IFC tag
//   // layout info may be available within tree
// }
