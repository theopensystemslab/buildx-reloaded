import { onCreated } from "~/utils/three"
import { Canvas } from "@react-three/fiber"
import { PropsWithChildren } from "react"
import { BasicShadowMap } from "three"

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
    </Canvas>
  )
}

export default VanillaR3FCanvas
