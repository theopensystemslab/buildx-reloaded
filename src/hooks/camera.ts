import { useMemo } from "react"
import { Raycaster } from "three"
import globals from "./globals"
import mapboxStore from "./mapboxStore"

export const useCameraGroundRaycast = () => {
  const raycaster = useMemo(() => new Raycaster(), [])

  return (): [number, number] | null => {
    if (!mapboxStore.cameraSync?.camera || !globals.groundMesh) return null

    raycaster.setFromCamera({ x: 0, y: 0 }, mapboxStore.cameraSync.camera)
    const intersections = raycaster.intersectObject(globals.groundMesh)
    if (intersections.length === 0) return null

    const [
      {
        point: { x, z },
      },
    ] = intersections

    return [x, z]
  }
}
