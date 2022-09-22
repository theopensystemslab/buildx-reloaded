import CameraSync from "@/threebox/camera/CameraSync"
import { RectReadOnly } from "react-use-measure"
import { Mesh } from "three"
import { proxy, ref, useSnapshot } from "valtio"

type GlobalStore = {
  mapboxMap: mapboxgl.Map | null
  cameraSync: CameraSync | null
  xzPointer: [number, number]
  xzMesh: Mesh | null
  size: RectReadOnly | null
}

const globals = proxy<GlobalStore>({
  mapboxMap: null,
  cameraSync: null,
  xzPointer: [0, 0],
  xzMesh: null,
  size: null,
})

export const setMapboxMap = (mapboxMap: mapboxgl.Map) => {
  globals.mapboxMap = ref(mapboxMap)
}

export const useGlobals = () => useSnapshot(globals)

export default globals
