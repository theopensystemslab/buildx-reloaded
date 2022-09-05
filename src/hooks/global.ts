import CameraSync from "@/threebox/camera/CameraSync"
import { proxy, ref } from "valtio"

type GlobalStore = {
  mapboxMap: mapboxgl.Map | null
  cameraSync: CameraSync | null
}

const global = proxy<GlobalStore>({
  mapboxMap: null,
  cameraSync: null,
})

export const setMapboxMap = (mapboxMap: mapboxgl.Map) => {
  global.mapboxMap = ref(mapboxMap)
}

export default global
