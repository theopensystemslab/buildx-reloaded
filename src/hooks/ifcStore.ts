import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { Material, MeshLambertMaterial } from "three"
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh"
import { proxy, ref } from "valtio"
import { subscribeKey } from "valtio/utils"
import { IFCLoader } from "web-ifc-three"
import { IFCModel } from "web-ifc-three/IFC/components/IFCModel"
import globals from "./globals"

type IFCStore = {
  loader: IFCLoader
  models: Record<string, IFCModel>
  highlightMaterial: Material
}

function initIfcLoader() {
  const loader = new IFCLoader()
  loader.ifcManager.setWasmPath("../../../wasm/")

  loader.ifcManager.setupThreeMeshBVH(
    computeBoundsTree,
    disposeBoundsTree,
    acceleratedRaycast
  )

  return loader
}

const ifcStore = proxy<IFCStore>({
  loader: ref(initIfcLoader()),
  models: {},
  highlightMaterial: new MeshLambertMaterial({
    transparent: true,
    opacity: 0.6,
    color: 0xff88ff,
    depthTest: false,
  }),
})

export const useIfcLoader = () => ifcStore.loader

export const pushIfcModel = (key: string, value: IFCModel) => {
  ifcStore.models[key] = value
}

export const useRaycasting = () => {
  const raycaster = useThree((t) => t.raycaster)
  const camera = useThree((t) => t.camera)

  useEffect(
    () =>
      subscribeKey(globals, "pointerXY", () => {
        const [x, y] = globals.pointerXY
        raycaster.setFromCamera({ x, y }, camera)
        const intersections = raycaster.intersectObjects(
          Object.values(ifcStore.models)
        )
        if (intersections.length > 0) {
          globals.intersection = ref(intersections[0])
        } else {
          globals.intersection = null
        }
      }),
    [camera, raycaster]
  )
}

export default ifcStore
