import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { forwardRef } from "react"
import { DoubleSide, Mesh } from "three"
import { RaycasterLayer } from "../constants"
import globals from "../hooks/globals"

type Props = {
  size?: number
  layers?: number
}

const DEFAULT_SIZE = 5000

const XZPlane = forwardRef<Mesh, Props>((props, ref) => {
  const { size = DEFAULT_SIZE, layers = RaycasterLayer.DISABLED } = props

  const bind: any = useGesture<{
    onPointerMove: ThreeEvent<PointerEvent>
  }>({
    onPointerMove: ({ event: { uv } }) => {
      if (uv) {
        globals.pointerXZ = [uv.x * size - size / 2, -(uv.y * size - size / 2)]
      }
    },
  })

  return (
    <mesh ref={ref} rotation-x={Math.PI / 2} layers={layers} {...bind()}>
      <planeBufferGeometry args={[size, size, 1, 1]} />
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
