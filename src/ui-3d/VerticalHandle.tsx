import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Group, Mesh } from "three"
import { subscribeKey } from "valtio/utils"
import { RaycasterLayer } from "../constants"
import { setCameraEnabled } from "../hooks/camera"
import dimensions from "../hooks/dimensions"
import globals from "../hooks/globals"
import houses from "../hooks/houses"
import CircularHandle from "./CircularHandle"
import YPlane from "./YPlane"

type Props = {
  houseId: string
}

const VerticalHandle = (props: Props) => {
  const { houseId } = props

  const groupRef = useRef<Group>(null)
  const handleRef = useRef<Mesh>(null)

  const [hovered, setHovered] = useState(false)

  const update = useCallback(() => {
    if (!groupRef.current || !(houseId in dimensions)) return
    const {
      position: { x: px, y: py, z: pz },
      rotation,
    } = houses[houseId]
    const { height, length } = dimensions[houseId]
    groupRef.current.position.set(px, height + 2, pz + length / 2)
    groupRef.current.rotation.y = rotation
  }, [houseId])

  useEffect(() => {
    update()
    return subscribeKey(dimensions, houseId, update)
  }, [houseId, update])

  const y0 = useRef(0)
  const dragging = useRef(false)

  // useEffect(() =>
  //   subscribeKey(events.after, "newHouseTransform", () => {
  //     if (
  //       !handleRef.current ||
  //       events.after.newHouseTransform === null ||
  //       events.after.newHouseTransform.houseId !== houseId
  //     )
  //       return
  //     const {
  //       positionDelta: [dx, dy, dz],
  //       rotation: dr,
  //     } = events.after.newHouseTransform
  //     handleRef.current.position.y += dy
  //   })
  // )

  const bind: any = useGesture<{ drag: ThreeEvent<PointerEvent> }>({
    onDrag: ({
      event: {
        intersections: [ix0],
      },
      first,
      last,
    }) => {
      if (!handleRef.current) return
      if (first) {
        y0.current = globals.pointerY
        setCameraEnabled(false)
        dragging.current = true
        return
      }

      const dy = globals.pointerY - y0.current

      // events.before.newHouseTransform = {
      //   houseId,
      //   positionDelta: [0, dy, 0],
      //   rotation: 0,
      // }

      y0.current = globals.pointerY

      if (last) {
        setCameraEnabled(true)
        dragging.current = false
      }
    },
    onHover: ({ hovering }) => {
      if (dragging.current && hovered) return
      setHovered(hovering ?? false)
    },
  })

  return (
    <group ref={groupRef}>
      <CircularHandle ref={handleRef} {...bind()} />
      <YPlane
        layers={hovered ? RaycasterLayer.ENABLED : RaycasterLayer.DISABLED}
      />
    </group>
  )
}

export default VerticalHandle
