import CameraSync from "@/threebox/camera/CameraSync"
import { RectReadOnly } from "react-use-measure"
import { Mesh } from "three"
import { proxy, ref, useSnapshot } from "valtio"

type GlobalStore = {
  mapboxMap: mapboxgl.Map | null
  cameraSync: CameraSync | null
  size: RectReadOnly | null
  pointerXY: V2
  groundMesh: Mesh | null
  sidebar: boolean
  preload: boolean
}

const globals = proxy<GlobalStore>({
  mapboxMap: null,
  cameraSync: null,
  size: null,
  pointerXY: [0, 0],
  groundMesh: null,
  sidebar: false,
  preload: false,
})

export const setMapboxMap = (mapboxMap: mapboxgl.Map) => {
  globals.mapboxMap = ref(mapboxMap)
}

export const useGlobals = () => useSnapshot(globals)

export const setSidebar = (b: boolean) => {
  globals.sidebar = b
  if (!globals.preload) globals.preload = true
}

export default globals
