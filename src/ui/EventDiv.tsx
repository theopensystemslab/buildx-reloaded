import { useGesture } from "@use-gesture/react"
import { PropsWithChildren, useEffect } from "react"
import useMeasure from "react-use-measure"
import globals from "../hooks/globals"

type Props = {}

const EventDiv = (props: PropsWithChildren<Props>) => {
  const { children } = props
  const [ref, size] = useMeasure({
    scroll: true,
    debounce: { scroll: 50, resize: 0 },
  })

  useEffect(() => {
    globals.size = size
  }, [size])

  const bind = useGesture(
    {
      onPointerMove: ({ event: { clientX, clientY } }) => {
        if (!globals.size) return
        const x1 = clientX - size.left
        const x2 = size.right - size.left
        const x = (x1 / x2) * 2 - 1

        const y1 = clientY - size.top
        const y2 = size.bottom - size.top
        const y = -(y1 / y2) * 2 + 1

        globals.pointerXY = [x, y]
      },
      onDrag: ({}) => {},
    },
    { eventOptions: { capture: true } }
  )

  return (
    <div ref={ref} className="absolute w-full h-full touch-none" {...bind()}>
      {children}
    </div>
  )
}

export default EventDiv
