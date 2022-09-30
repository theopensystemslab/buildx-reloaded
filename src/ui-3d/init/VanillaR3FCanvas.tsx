import { Canvas } from "@react-three/fiber"
import { PropsWithChildren } from "react"
import SiteCamControls from "../camera/SiteCamControls"

type Props = PropsWithChildren<{}>

const VanillaR3FCanvas = (props: Props) => {
  const { children } = props
  return (
    <Canvas>
      {children}
      <SiteCamControls />
    </Canvas>
  )
}

export default VanillaR3FCanvas
