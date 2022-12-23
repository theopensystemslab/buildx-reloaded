import { useThree } from "@react-three/fiber"
import React, { PropsWithChildren, useEffect, useRef } from "react"
import { useGlobals } from "../../hooks/globals"
import mapboxStore, { useMapboxStore } from "../../hooks/mapboxStore"
import CameraSync from "@/threebox/camera/CameraSync"
import { Group } from "three"
import { DEFAULT_ORIGIN } from "../../constants"
import { pipe } from "fp-ts/lib/function"
import utils from "../../threebox/utils/utils"

type Props = PropsWithChildren<{}>

const MapboxR3FCanvasProjector = (props: Props) => {
  const { children } = props
  const worldRef = useRef<Group>(null)

  const { camera, setSize } = useThree()
  const { size } = useGlobals()
  const { mapboxMap } = useMapboxStore()

  useEffect(() => {
    if (size === null) return
    const { width, height } = size
    setSize(width, height)

    if (mapboxMap !== null) {
      mapboxStore.cameraSync = new CameraSync(
        mapboxMap,
        camera,
        worldRef.current
      )
    }
  }, [camera, mapboxMap, setSize, size])

  const [lat, lng] = DEFAULT_ORIGIN

  const mapCenter = pipe(utils.projectToWorld([lng, lat]), (v3) => {
    return v3
  })

  const perMeter = utils.projectedUnitsPerMeter(lat)

  return (
    <group ref={worldRef}>
      <group scale={perMeter} position={mapCenter} rotation-x={Math.PI / 2}>
        {children}
      </group>
    </group>
  )
}

export default MapboxR3FCanvasProjector
