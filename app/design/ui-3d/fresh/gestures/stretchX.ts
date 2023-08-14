import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"

const useOnDragStretchX = () => {
  const onDragStretchX: Handler<"drag", ThreeEvent<PointerEvent>> = () => {}

  return onDragStretchX
}

export default useOnDragStretchX
