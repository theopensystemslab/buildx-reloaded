import { useThree } from "@react-three/fiber"
import { useMemo } from "react"
import { Raycaster } from "three"
import globals from "./globals"

export const useCameraGroundRaycast = () => {
  const raycaster = useMemo(() => new Raycaster(), [])

  return (): [number, number] | null => {
    if (!globals.cameraSync?.camera || !globals.groundMesh) return null

    raycaster.setFromCamera({ x: 0, y: 0 }, globals.cameraSync.camera)
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
