import { Instance } from "@react-three/drei"
import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useRef } from "react"
import { ElementInstanceInput } from "../../hooks/instances"
import { useElementInstancePosition } from "../../hooks/transforms"

const ElementInstance = ({ data }: { data: ElementInstanceInput }) => {
  const ref = useRef<any>()

  const { houseId } = data

  const bind = useGesture<{ drag: ThreeEvent<PointerEvent> }>({
    onDrag: ({
      event: {
        object: { userData },
      },
    }) => {
      // console.log(userData)
      // console.log(ref.current)
    },
  })

  useElementInstancePosition({
    ...data,
    ref,
  })

  return <Instance ref={ref} userData={data} {...(bind() as any)} />
}

export default ElementInstance
