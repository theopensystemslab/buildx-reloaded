import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
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
}

function getIFCLoader() {
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
  loader: ref(getIFCLoader()),
  models: {},
})

export const useIFCLoader = () => ifcStore.loader

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
        console.log(globals.intersection)
      }),
    [camera, raycaster]
  )
}

export default ifcStore
