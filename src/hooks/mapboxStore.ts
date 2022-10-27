import CameraSync from "@/threebox/camera/CameraSync"
import { proxy, ref, useSnapshot } from "valtio"

type MapboxStore = {
  mapboxEnabled: boolean
  mapboxMap: mapboxgl.Map | null
  cameraSync: CameraSync | null
}

const mapboxStore = proxy<MapboxStore>({
  mapboxEnabled: false,
  mapboxMap: null,
  cameraSync: null,
})

export const setMapboxMap = (mapboxMap: mapboxgl.Map) => {
  mapboxStore.mapboxMap = ref(mapboxMap)
}

export const setMapboxEnabled = (b: boolean) => {
  mapboxStore.mapboxEnabled = b
}

export const useMapboxStore = () => useSnapshot(mapboxStore)

export default mapboxStore
