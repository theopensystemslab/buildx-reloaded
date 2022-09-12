import type { ReactNode } from "react"
import React, { useRef } from "react"
import IconButton from "./IconButton"
import { Close } from "./icons"

export interface Props {
  expanded: boolean
  onClose: () => void
  children?: ReactNode
}

export default function Sidebar(props: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  return (
    <div
      ref={containerRef}
      className={`absolute top-0 right-0 bottom-0 z-30 h-full w-96 overflow-auto bg-white shadow-lg transition-all duration-300 ${
        props.expanded ? "" : "translate-x-full transform"
      }`}
    >
      <div className="sticky top-0 flex justify-end">
        <IconButton onClick={props.onClose}>
          <Close />
        </IconButton>
      </div>
      {props.children}
    </div>
  )
}
