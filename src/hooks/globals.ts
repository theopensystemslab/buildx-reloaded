import CameraSync from "@/threebox/camera/CameraSync"
import { RectReadOnly } from "react-use-measure"
import { Group, Mesh } from "three"
import { proxy, ref, useSnapshot } from "valtio"

type GlobalStore = {
  mapboxMap: mapboxgl.Map | null
  cameraSync: CameraSync | null
  size: RectReadOnly | null
  pointerXY: V2
  groundMesh: Mesh | null
}

const globals = proxy<GlobalStore>({
  mapboxMap: null,
  cameraSync: null,
  size: null,
  pointerXY: [0, 0],
  groundMesh: null,
})

export const setMapboxMap = (mapboxMap: mapboxgl.Map) => {
  globals.mapboxMap = ref(mapboxMap)
}

export const useGlobals = () => useSnapshot(globals)

export default globals
