import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { forwardRef } from "react"
import { DoubleSide, Mesh } from "three"
import { RaycasterLayer } from "../constants"
import elementDragEvents, { useElementDragStart } from "../hooks/dragEvents"

type Props = {
  size?: number
  layers?: number
}

const DEFAULT_SIZE = 5000

const XZPlane = forwardRef<Mesh, Props>((props, ref) => {
  const { size = DEFAULT_SIZE } = props

  const elementDragStart = useElementDragStart()

  const bind: any = useGesture<{
    onPointerMove: ThreeEvent<PointerEvent>
  }>({
    onPointerMove: ({ event: { uv } }) => {
      if (elementDragStart !== null && uv) {
        const [x, z] = [uv.x * size - size / 2, uv.y * size - size / 2]
        elementDragEvents.drag = {
          element: elementDragStart.element,
          point: { x, y: elementDragStart.point.y, z },
        }
      }
    },
  })

  return (
    <mesh
      ref={ref}
      rotation-x={Math.PI / 2}
      position={[0, elementDragStart?.point.y ?? 0, 0]}
      layers={
        elementDragStart === null
          ? RaycasterLayer.DISABLED
          : RaycasterLayer.ENABLED
      }
      {...bind()}
    >
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
