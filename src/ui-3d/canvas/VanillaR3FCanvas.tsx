import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import React from "react"
import { PropsWithChildren } from "react"

type Props = PropsWithChildren<{}>

const VanillaR3FCanvas = (props: Props) => {
  const { children } = props
  return (
    <Canvas>
      {children}
      <OrbitControls />
    </Canvas>
  )
}

export default VanillaR3FCanvas
