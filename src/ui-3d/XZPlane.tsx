import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { forwardRef, useEffect, useRef } from "react"
import mergeRefs from "react-merge-refs"
import { DoubleSide, Mesh } from "three"
import { RaycasterLayer } from "../constants"
import { useDragStart } from "../hooks/gestures"
import globals from "../hooks/globals"

type Props = {
  size?: number
  layers?: number
}

const DEFAULT_SIZE = 5000

const XZPlane = forwardRef<Mesh, Props>((props, ref) => {
  const localRef = useRef<Mesh>(null)
  const { size = DEFAULT_SIZE } = props

  const dragStart = useDragStart()

  useEffect(() => {
    if (!localRef.current) return
    if (dragStart) {
      localRef.current.position.setY(dragStart.point.y)
    } else {
      localRef.current.position.setY(0)
    }
  }, [dragStart])

  const bind: any = useGesture<{
    onPointerMove: ThreeEvent<PointerEvent>
  }>({
    onPointerMove: ({ event: { uv } }) => {
      if (!uv) return
      globals.pointerXZ = [uv.x * size - size / 2, uv.y * size - size / 2]
    },
  })

  return (
    <mesh
      ref={mergeRefs([localRef, ref])}
      rotation-x={Math.PI / 2}
      position={[0, dragStart?.point.y ?? 0, 0]}
      layers={
        dragStart === null ? RaycasterLayer.DISABLED : RaycasterLayer.ENABLED
      }
      {...bind()}
    >
      <planeGeometry args={[size, size, 1, 1]} />
      <meshBasicMaterial
        color={0x248f24}
        // visible={false}
        side={DoubleSide}
        alphaTest={0}
      />
    </mesh>
  )
})

export default XZPlane
