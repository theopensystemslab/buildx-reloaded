import { useThree } from "@react-three/fiber"
import { useRef } from "react"
import { Mesh } from "three"

const TestBox = () => {
  const boxRef = useRef<Mesh>(null)

  return (
    <group>
      <mesh ref={boxRef}>
        <boxGeometry />
        <meshBasicMaterial color="tomato" />
      </mesh>
    </group>
  )
}

export default TestBox
