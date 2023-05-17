import { useHelper } from "@react-three/drei"
import { MeshProps, useThree } from "@react-three/fiber"
import React, { useEffect, useRef } from "react"
import { Mesh } from "three"
import { VertexNormalsHelper } from "three-stdlib"

type Props = MeshProps

const DebugSpeckleElement = (props: Props) => {
  const meshRef = useRef<Mesh>(null)
  // useHelper(meshRef, VertexNormalsHelper, 2, 0xff0000)
  // Assume mesh is your Mesh object with the geometry you want to visualize normals for

  // const helper = new VertexNormalsHelper(meshRef, 2, 0x00ff00); // The second parameter is the size of the lines, and the third is the color.
  // scene.add(helper);

  // const count = useRef(0)

  // const scene = useThree((t) => t.scene)

  // useEffect(() => {
  //   if (!meshRef.current) return
  //   if (count.current >= 1) return

  //   const helper = new VertexNormalsHelper(meshRef.current, 2, 0x00ff00) // The second parameter is the size of the lines, and the third is the color.
  //   scene.add(helper)
  //   console.log(meshRef.current.geometry.getAttribute("normal"))
  //   count.current += 1
  // }, [scene])

  return <mesh ref={meshRef} {...props} />
}

export default DebugSpeckleElement
