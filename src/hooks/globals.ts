import CameraSync from "@/threebox/camera/CameraSync"
import { Mesh } from "three"
import { proxy, ref } from "valtio"

type GlobalStore = {
  mapboxMap: mapboxgl.Map | null
  cameraSync: CameraSync | null
  xzPointer: [number, number]
  xzMesh: Mesh | null
}

const globals = proxy<GlobalStore>({
  mapboxMap: null,
  cameraSync: null,
  xzPointer: [0, 0],
  xzMesh: null,
})

export const setMapboxMap = (mapboxMap: mapboxgl.Map) => {
  globals.mapboxMap = ref(mapboxMap)
}

export default globals
