import React from "react"
import type { ReactNode } from "react"

export interface Props {
  children?: ReactNode
}

export default function ContextMenuHeading(props: Props) {
  return (
    <div className="block w-full select-none whitespace-pre border-b border-gray-200 py-2 px-3 text-left text-sm text-gray-500">
      {props.children}
    </div>
  )
}
