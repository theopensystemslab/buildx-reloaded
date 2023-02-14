import { CamControls } from "@/ui-3d/camera/CamControls"
import camera, { defaultCamPos } from "@/hooks/camera"
import { useUserAgent } from "@oieduardorabelo/use-user-agent"
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import CameraControls from "camera-controls"
import React, { Fragment, useEffect } from "react"
import { ref } from "valtio"
import { useGlobals } from "@/hooks/globals"

const SiteCamControls = () => {
  const { orthographic, groundPlane } = useGlobals()
  const size = useThree(({ size }) => size)
  const ratio = 10
  const userAgent = useUserAgent()
  const dollyToCursor = true
  const truckSpeed = 2.0

  useEffect(() => {
    if (!camera.controls) return
    camera.controls.mouseButtons.right = CameraControls.ACTION.TRUCK
  }, [orthographic])

  return (
    <Fragment>
      <PerspectiveCamera position={defaultCamPos} makeDefault={!orthographic} />
      <OrthographicCamera
        position={defaultCamPos}
        left={-size.width / 2 / ratio}
        right={size.width / 2 / ratio}
        top={size.height / 2 / ratio}
        bottom={-size.height / 2 / ratio}
        near={-500}
        far={500}
        makeDefault={orthographic}
      />
      <CamControls
        {...{
          maxPolarAngle: groundPlane ? Math.PI / 2 : Math.PI,
          maxDistance: 100,
          minZoom: 0.2,
          dollySpeed:
            userAgent?.os?.name &&
            ["Mac OS"].includes(String(userAgent.os.name))
              ? -1.0
              : 1.0,
          dollyToCursor,
          truckSpeed,
          restThreshold: 0.01,
          dampingFactor: 0.25,
        }}
        setControls={(controls) => void (camera.controls = ref(controls))}
      />
    </Fragment>
  )
}

export default SiteCamControls
