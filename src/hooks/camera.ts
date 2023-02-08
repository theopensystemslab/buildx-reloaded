import CameraControls from "camera-controls"
import { useMemo } from "react"
import { Matrix4, Raycaster, Vector3 } from "three"
import { proxy, useSnapshot } from "valtio"
import houses from "./houses"

type CameraProxy = {
  controls: CameraControls | null
  lastLookAt: V6
}

export const defaultCamPos: [number, number, number] = [-12, 24, -12]
export const defaultCamTgt: [number, number, number] = [0, 0, 0]

const camera = proxy<CameraProxy>({
  controls: null,
  lastLookAt: [...defaultCamPos, ...defaultCamTgt],
})

export const setCameraEnabled = (b: boolean) => {
  if (camera.controls) camera.controls.enabled = b
}

export type Side = "LEFT" | "RIGHT"

export const getSide = (houseId: string) => {
  const houseDirection = new Vector3(0, 0, -1)
  const rotationMatrix = new Matrix4().makeRotationY(houses[houseId].rotation)
  houseDirection.applyMatrix4(rotationMatrix)

  const cameraDirection = new Vector3()
  camera.controls?.camera.getWorldDirection(cameraDirection)

  const v = new Vector3()
  v.crossVectors(houseDirection, cameraDirection)

  return v.y < 0 ? "LEFT" : "RIGHT"
}

// export const useCameraFocus = () => {
//   const houses = useHouses()
//   const { buildingId } = useSiteContext()
//   const house = buildingId ? houses[buildingId] : null

//   const buildingLength = pipe(
//     useMaybeBuildingLength(buildingId),
//     getOrElse(() => 0)
//   )

//   const rotateVector = useRotateVector(buildingId)

//   useEffect(() => {
//     if (!camera.controls) return

//     setCameraEnabled(true)

//     if (!house) {
//       camera.controls.setLookAt(...camera.lastLookAt, true)
//     } else {
//       const {
//         position: [x0, z0],
//       } = house
//       const [mx, mz] = rotateVector([0, buildingLength / 2])
//       const [x, z] = [x0 + mx, z0 + mz]
//       const v3Pos = new Vector3()
//       const v3Tgt = new Vector3()
//       camera.controls.getPosition(v3Pos)
//       camera.controls.getTarget(v3Tgt)
//       camera.lastLookAt = [...v3Pos.toArray(), ...v3Tgt.toArray()]
//       camera.controls.setLookAt(x - 12, 24, z - 12, x, 0, z, true)
//     }
//   }, [buildingId])
// }

export const useCameraReset = () => {
  return () => {
    if (!camera.controls) return
    camera.controls.setLookAt(...defaultCamPos, ...defaultCamTgt, true)
    camera.controls.zoomTo(1, true)
  }
}

// export const useGetCameraGroundPlaneIntersect = () => {
//   const raycaster = useMemo(() => new Raycaster(), [])

//   return (): [number, number] | null => {
//     if (!camera.controls || !pointer.planeMesh) return null

//     raycaster.setFromCamera({ x: 0, y: 0 }, camera.controls.camera)
//     const intersections = raycaster.intersectObject(pointer.planeMesh)
//     if (intersections.length === 0) return null

//     const [
//       {
//         point: { x, z },
//       },
//     ] = intersections

//     return [x, z]
//   }
// }

export default camera

// import { useMemo } from "react"
// import { Raycaster } from "three"
// import globals from "./globals"
// import mapboxStore from "./mapboxStore"

export const useCameraGroundRaycast = () => {
  const raycaster = useMemo(() => new Raycaster(), [])

  return (): Vector3 | null => {
    return new Vector3(0, 0, 0)
    // if (!mapboxStore.cameraSync?.camera || !globals.groundMesh) return null

    // raycaster.setFromCamera({ x: 0, y: 0 }, mapboxStore.cameraSync.camera)
    // const intersections = raycaster.intersectObject(globals.groundMesh)
    // if (intersections.length === 0) return null

    // const [
    //   {
    //     point: { x, z },
    //   },
    // ] = intersections

    // return [x, 0, z]
  }
}
