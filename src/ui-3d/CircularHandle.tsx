import { MeshProps } from "@react-three/fiber"
import React, { forwardRef } from "react"
import { Mesh } from "three"
import HandleMaterial from "../materials/HandleMaterial"

const CircularHandle = forwardRef<Mesh, MeshProps>((props, ref) => {
  return (
    <mesh ref={ref} {...props}>
      <circleBufferGeometry args={[0.5, 10]} />
      <HandleMaterial />
    </mesh>
  )
})

export default CircularHandle
