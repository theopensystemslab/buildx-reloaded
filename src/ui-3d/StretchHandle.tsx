import { invalidate, MeshProps, ThreeEvent } from "@react-three/fiber"
import { Handler, useGesture } from "@use-gesture/react"
import { forwardRef, useEffect, useRef } from "react"
import mergeRefs from "react-merge-refs"
import { Color, Mesh, MeshStandardMaterial } from "three"
import { setCameraEnabled } from "../hooks/camera"
import { useGlobals } from "../hooks/globals"
import CircularHandle from "./CircularHandle"

type StretchHandleProps = MeshProps & {
  onDrag?: Handler<"drag", ThreeEvent<PointerEvent>>
  onHover?: Handler<"hover", ThreeEvent<PointerEvent>>
}

const StretchHandle = forwardRef<Mesh, StretchHandleProps>(
  (props, forwardedRef) => {
    const localRef = useRef<Mesh>()
    const { onDrag, onHover, ...meshProps } = props
    const { shadows } = useGlobals()

    const bind = useGesture<{
      drag: ThreeEvent<PointerEvent>
      hover: ThreeEvent<PointerEvent>
    }>({
      onHover: (state) => {
        if (state.hovering) {
          document.body.style.cursor = "grab"
        } else {
          document.body.style.cursor = ""
        }
        onHover?.(state)
      },
      onDrag: (state) => {
        const { first, last } = state
        if (first) setCameraEnabled(false)
        if (last) setCameraEnabled(true)
        onDrag?.(state)
        invalidate()
      },
    })

    useEffect(() => {
      if (!localRef.current) return
      if (shadows) {
        ;(localRef.current.material as MeshStandardMaterial).color = new Color(
          "white"
        )
      } else {
        ;(localRef.current.material as MeshStandardMaterial).color = new Color(
          "black"
        )
      }
    }, [shadows])

    return (
      <CircularHandle
        ref={mergeRefs([localRef, forwardedRef])}
        rotation-x={-Math.PI / 2}
        {...meshProps}
      />
    )
  }
)

export default StretchHandle
