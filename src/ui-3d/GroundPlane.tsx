/**
 * This module renders an invisible horizontal plane that records where the mouse
 * cursor is on a horizontal plane. This position is broadcast to the parent where it
 * can be stored, usually in a ref to keep performance in check.
 */
import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useEffect, useRef } from "react"
import * as three from "three"
import { Mesh } from "three"
import { ref } from "valtio"
import globals from "../hooks/globals"

// Make sure this value is always larger than the model bounds
const planeSize = 5000

const plane: three.BufferGeometry = new three.PlaneBufferGeometry(
  planeSize,
  planeSize,
  1,
  1
)

const planeMaterial: three.Material = new three.MeshBasicMaterial({
  color: 0x248f24,
  alphaTest: 0,
  visible: false,
})

const GroundPlane = (props: {
  onChange?: (pos: [number, number]) => void
  onNearHover?: () => void
  onNearClick?: () => void
}) => {
  const { onChange, onNearClick, onNearHover } = props
  const meshRef = useRef<Mesh>(null)

  useEffect(() => {
    if (!meshRef.current) return
    globals.groundMesh = ref(meshRef.current)
  }, [])

  const bind = useGesture<{
    onPointerMove: ThreeEvent<PointerEvent>
    onClick: ThreeEvent<PointerEvent>
  }>({
    onPointerMove: ({ event: { intersections, uv } }) => {
      if (onChange && uv)
        onChange([
          uv.x * planeSize - planeSize / 2,
          -(uv.y * planeSize - planeSize / 2),
        ])

      if (onNearHover) {
        const ix = intersections[0]
        if ((ix?.eventObject || ix?.object).uuid === meshRef?.current?.uuid) {
          onNearHover()
        }
      }
    },
    onClick: ({ event }) => {
      if (onNearClick) {
        const ix = event.intersections[0]
        if ((ix?.eventObject || ix?.object).uuid === meshRef?.current?.uuid) {
          onNearClick()
        }
      }
    },
  })

  return (
    <mesh
      ref={meshRef}
      geometry={plane}
      rotation={[-Math.PI / 2, 0, 0]}
      material={planeMaterial}
      {...(bind() as any)}
    />
  )
}

export default GroundPlane
