import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { forwardRef, useRef } from "react"
import mergeRefs from "react-merge-refs"
import { DoubleSide, Mesh } from "three"
import { CameraLayer, RaycasterLayer } from "../state/constants"
import pointer from "../state/pointer"
import {
  usePointerDownListener,
  usePointerUpListener,
} from "./fresh/gestures/events"

const DEBUG_XZ_PLANE = false

type Props = {
  size?: number
  layers?: number
}

const DEFAULT_SIZE = 5000

const XZPlane = forwardRef<Mesh, Props>((props, ref) => {
  const localRef = useRef<Mesh>(null)
  const { size = DEFAULT_SIZE } = props

  usePointerDownListener(({ point: { x, y, z } }) => {
    if (!localRef.current) return
    pointer.xz = [x, z]
    localRef.current.position.setY(y)
    localRef.current.layers.set(RaycasterLayer.ENABLED)
    if (DEBUG_XZ_PLANE) {
      console.debug(`DEBUG XZPlane: POINTER_DOWN CameraLayer.VISIBLE`)
      localRef.current.layers.enable(CameraLayer.VISIBLE)
    }
  })

  usePointerUpListener(() => {
    if (!localRef.current) return
    localRef.current.layers.set(RaycasterLayer.DISABLED)
    if (DEBUG_XZ_PLANE)
      console.debug(`DEBUG XZPlane: POINTER_UP RaycasterLayer.DISABLED`)
  })

  const bind: any = useGesture<{
    onPointerMove: ThreeEvent<PointerEvent>
  }>({
    onPointerMove: ({ event: { uv } }) => {
      if (!uv) return
      pointer.xz = [uv.x * size - size / 2, uv.y * size - size / 2]
    },
  })

  return (
    <mesh
      ref={mergeRefs([localRef, ref])}
      rotation-x={Math.PI / 2}
      layers={DEBUG_XZ_PLANE ? CameraLayer.VISIBLE : RaycasterLayer.DISABLED}
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
