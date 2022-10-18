import { useGesture } from "@use-gesture/react"
import { Fragment, useRef } from "react"
import { setCameraEnabled } from "../hooks/camera"
import events from "../hooks/events"
import globals from "../hooks/globals"
import houses from "../hooks/houses"
import HandleMaterial from "../materials/HandleMaterial"

type Props = {
  houseId: string
  houseLength: number
  houseWidth: number
}

const RotateHandles = (props: Props) => {
  const { houseId, houseWidth, houseLength } = props
  const uvAtDragStart = useRef<[number, number]>([0, 0])
  const initialRotation = useRef<number>(0)

  const bind = useGesture({
    onHover: (data) => {
      if (data.hovering) {
        document.body.style.cursor = "grab"
      } else {
        document.body.style.cursor = ""
      }
    },
    onDrag: ({ first, last, event }) => {
      event.stopPropagation()
      if (first) {
        setCameraEnabled(false)
        uvAtDragStart.current = globals.pointerXZ
        initialRotation.current = houses[houseId].rotation
      }
      const [x0, y0] = uvAtDragStart.current
      const [hx, , hz] = houses[houseId].position
      const [x, y] = globals.pointerXZ
      const angle0 = Math.atan2(y0 - hz, x0 - hx)
      const angle = Math.atan2(y - hz, x - hx)

      events.before.newHouseTransform = {
        houseId,
        rotation: initialRotation.current - (angle - angle0),
      }

      if (last) {
        setCameraEnabled(true)
      }
      // invalidate()
    },
  })

  return (
    <Fragment>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0, -1.5]}
        {...(bind(0) as any)}
      >
        <circleBufferGeometry args={[0.5, 10]} />
        <HandleMaterial />
      </mesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[-houseWidth / 2 - 1.5, 0, houseLength / 2]}
        {...(bind(1) as any)}
      >
        <circleBufferGeometry args={[0.5, 10]} />
        <HandleMaterial />
      </mesh>
    </Fragment>
  )
}
export default RotateHandles
