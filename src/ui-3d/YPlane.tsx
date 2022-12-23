import { ThreeEvent, useThree } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { forwardRef, useEffect, useMemo, useRef } from "react"
import { DoubleSide, Layers, Mesh } from "three"
import { CameraLayer, RaycasterLayer } from "../constants"
import globals from "../hooks/globals"

type Props = {
  width?: number
  height?: number
  layers?: number
}

const DEFAULT_SIZE = 5000

const YPlane = forwardRef<Mesh, Props>((props, ref) => {
  const {
    width = DEFAULT_SIZE,
    height = DEFAULT_SIZE,
    layers = RaycasterLayer.DISABLED,
  } = props

  const bind: any = useGesture<{
    onPointerMove: ThreeEvent<PointerEvent>
  }>({
    onPointerMove: ({ event: { uv } }) => {
      if (uv) {
        globals.pointerY = uv.y * height
      }
    },
  })

  return (
    <mesh layers={layers} {...bind()}>
      <planeGeometry args={[width, height, 1, 1]} />
      <meshBasicMaterial
        color={0x248f24}
        visible={false}
        side={DoubleSide}
        alphaTest={0}
      />
    </mesh>
  )
})

export default YPlane
