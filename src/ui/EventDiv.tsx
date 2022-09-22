import React, { PropsWithChildren, useEffect } from "react"
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

  return (
    <div ref={ref} className="absolute w-full h-full">
      {children}
    </div>
  )
}

export default EventDiv
