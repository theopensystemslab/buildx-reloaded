import { useRef } from "react"
import { DoubleSide, Mesh } from "three"

const GroundCircle = () => {
  const ref = useRef<Mesh>(null)

  return (
    <mesh ref={ref} position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[500, 32]} />
      <meshStandardMaterial side={DoubleSide} color="#bbb" />
    </mesh>
  )
}

export default GroundCircle
