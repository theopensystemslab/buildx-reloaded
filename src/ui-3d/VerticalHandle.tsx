import { ThreeEvent } from "@react-three/fiber"
import { useDrag, useGesture } from "@use-gesture/react"
import { useCallback, useEffect, useRef } from "react"
import { Mesh } from "three"
import { subscribeKey } from "valtio/utils"
import { setCameraEnabled } from "../hooks/camera"
import dimensions from "../hooks/dimensions"
import CircularHandle from "./CircularHandle"

type Props = {
  houseId: string
}

const VerticalHandle = (props: Props) => {
  const { houseId } = props

  const handleRef = useRef<Mesh>(null)

  const update = useCallback(() => {
    if (!handleRef.current || !(houseId in dimensions)) return
    const { height, length } = dimensions[houseId]
    handleRef.current.position.set(0, height + 2, length / 2)
  }, [houseId])

  useEffect(() => {
    update()
    return subscribeKey(dimensions, houseId, update)
  }, [houseId, update])

  const y0 = useRef(0)
  const yd = useRef(0)

  const bind: any = useGesture<{ drag: ThreeEvent<PointerEvent> }>({
    onDrag: ({
      event,
      event: {
        intersections: [ix0],
      },
      first,
      last,
    }) => {
      if (ix0.object.uuid !== handleRef.current?.uuid) {
        console.log("other object")
      }
      event.stopPropagation()
      if (first) {
        setCameraEnabled(false)
        // y0.current = ix0.uv?.y ?? ix0.uv2?.y ?? 0
        return
      }
      // const y1 = ix0.uv?.y ?? ix0.uv2?.y ?? 0
      // const delta = y1 - y0.current
      // console.log(delta)
      // // houses[houseId].position = addV3(houses[houseId].position, [0, delta, 0])
      // handleRef.current.position.y += delta
      // console.log("updated")
      if (last) setCameraEnabled(true)
    },
  })

  return <CircularHandle ref={handleRef} {...bind()} />
}

export default VerticalHandle
