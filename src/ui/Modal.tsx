import React, { useRef } from "react"
import type { ReactNode } from "react"
import { useClickAway, useEscape } from "./utils"
import usePortal from "react-cool-portal"

export interface Props {
  onClose: () => void
  title: string
  children?: ReactNode
}

export default function Modal(props: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const { Portal } = usePortal()
  useClickAway(contentRef, props.onClose)
  useEscape(props.onClose)

  return (
    <Portal>
      <div
        id="modal"
        className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-[rgba(0,0,0,0.6)] p-2"
      >
        <div
          ref={contentRef}
          className="max-w-md space-y-4 rounded bg-white p-4 shadow-lg"
        >
          <h2 className="text-lg">{props.title}</h2>
          {props.children}
        </div>
      </div>
    </Portal>
  )
}
