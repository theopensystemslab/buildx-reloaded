import { MeshProps } from "@react-three/fiber"
import { forwardRef } from "react"
import { Mesh } from "three"
import { useHandleMaterial } from "../hooks/handleMaterial"

const CircularHandle = forwardRef<Mesh, MeshProps>((props, ref) => {
  const material = useHandleMaterial()
  return (
    <mesh ref={ref} material={material} {...props}>
      <circleGeometry args={[0.5, 10]} />
    </mesh>
  )
})

export default CircularHandle
