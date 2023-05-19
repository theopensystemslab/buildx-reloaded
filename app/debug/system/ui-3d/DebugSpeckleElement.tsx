import { useHelper } from "@react-three/drei"
import { MeshProps, useThree } from "@react-three/fiber"
import React, { useEffect, useRef } from "react"
import { Mesh } from "three"
import { VertexNormalsHelper } from "three-stdlib"

type Props = MeshProps

const DebugSpeckleElement = (props: Props) => {
  const meshRef = useRef<Mesh>(null)

  return <mesh ref={meshRef} {...props} />
}

export default DebugSpeckleElement
