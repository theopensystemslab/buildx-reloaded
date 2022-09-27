import { useThree } from "@react-three/fiber"
import React, { useEffect, useMemo, useRef } from "react"
import { Mesh, Raycaster } from "three"
import { subscribeKey } from "valtio/utils"
import globals from "../hooks/globals"
import mapboxStore from "../hooks/mapboxStore"

const TestBox = () => {
  const boxRef = useRef<Mesh>(null)
  const raycaster = useThree((t) => t.raycaster)
  const camera = useThree((t) => t.camera)

  // const raycaster = useMemo(() => new Raycaster(), [])

  useEffect(() => {
    return subscribeKey(globals, "pointerXY", () => {
      if (!boxRef.current) return
      // console.log(ifcStore.models)
      const [x, y] = globals.pointerXY
      raycaster.setFromCamera({ x, y }, camera)
      const foo = raycaster.intersectObject(boxRef.current, true)
      if (foo.length > 0) console.log(foo)
    })
  }, [camera, raycaster])

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
