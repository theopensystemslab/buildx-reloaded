import { Fragment, useRef } from "react"
import { DirectionalLight } from "three"

const intensityScale = 0.76

const Lighting = () => {
  const shadowLightRef = useRef<DirectionalLight>(null!)

  // useHelper(shadowLightRef, DirectionalLightHelper)

  // const scene = useThree((t) => t.scene)

  // const cameraHelperRef = useRef<any>()

  // useEffect(() => {
  //   const cleaner = () => {
  //     if (cameraHelperRef.current) scene.remove(cameraHelperRef.current)
  //   }

  //   if (!shadowLightRef.current || !shadowLightRef.current.shadow.camera)
  //     return cleaner

  //   cameraHelperRef.current = new CameraHelper(
  //     shadowLightRef.current.shadow.camera
  //   )

  //   scene.add(cameraHelperRef.current)

  //   return cleaner
  // }, [scene])

  return (
    <Fragment>
      <ambientLight intensity={0.5 * intensityScale} />
      <directionalLight
        position={[0, 20, 20]}
        color="#b5d7fc"
        intensity={0.8 * intensityScale}
      />
      <directionalLight
        position={[-20, 20, 0]}
        color="#ffffff"
        intensity={0.3 * intensityScale}
      />
      <directionalLight
        position={[20, 20, 0]}
        color="#9bb9c6"
        intensity={0.3 * intensityScale}
      />
      <directionalLight
        ref={shadowLightRef}
        position={[0, 150, -150]}
        color="#fffcdb"
        intensity={0.8 * intensityScale}
        shadow-camera-far={300}
        shadow-camera-top={21.5}
        shadow-camera-bottom={-21.5}
        shadow-camera-left={-30.5}
        shadow-camera-right={30.5}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        castShadow
      />
    </Fragment>
  )
}

export default Lighting
