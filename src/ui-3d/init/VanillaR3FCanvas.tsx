import { Canvas } from "@react-three/fiber"
import { PropsWithChildren } from "react"
import { BasicShadowMap } from "three"
import { onCreated } from "../../utils/three"
import SiteCamControls from "../camera/SiteCamControls"

type Props = PropsWithChildren<{}>

const VanillaR3FCanvas = (props: Props) => {
  const { children } = props

  return (
    <Canvas
      onCreated={onCreated}
      shadows={{
        enabled: true,
        type: BasicShadowMap,
      }}
      frameloop="demand"
    >
      {children}
      <SiteCamControls />
    </Canvas>
  )
}

export default VanillaR3FCanvas
