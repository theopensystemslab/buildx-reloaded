import { Plane } from "@react-three/drei"
import React from "react"
import { DoubleSide } from "three"

const ShadowPlane = () => {
  return (
    <Plane
      position={[0, -0.02, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      args={[100, 100]}
    >
      <shadowMaterial color="#898989" side={DoubleSide} />
      {/* <meshBasicMaterial side={DoubleSide} color="red" /> */}
    </Plane>
  )
}

export default ShadowPlane
