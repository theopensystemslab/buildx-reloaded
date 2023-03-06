import type { ReactNode } from "react"
import React, { useRef } from "react"
import mergeRefs from "react-merge-refs"
import useMeasure from "react-use-measure"
import { useWindowSize } from "usehooks-ts"
import { useSnapshot } from "valtio"
import { ScopeItem } from "../../../hooks/scope"
import { useClickAway, useEscape } from "../../utils"

export type ContextMenuProps = {
  pageX: number
  pageY: number
  selected: ScopeItem
  onClose?: () => void
  children?: ReactNode
}

export default function ContextMenu(props: ContextMenuProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useClickAway(containerRef, props.onClose)

  useEscape(props.onClose)

  const [measureRef, { top, left, right, bottom }] = useMeasure()

  const windowSize = useWindowSize()

  // const { betaBanner } = useSnapshot(banners)

  const y0 = 0 // betaBanner ? -48 : 0

  const tx =
    left < 0 ? 0 : right > windowSize.width ? -(right - windowSize.width) : 0

  const ty =
    top < 0
      ? y0
      : bottom > windowSize.height
      ? -(bottom - windowSize.height - y0)
      : y0

  return (
    <div
      className="absolute h-[1px] w-[1px]"
      style={{
        top: props.pageY,
        left: props.pageX,
      }}
    >
      <div
        ref={mergeRefs([containerRef, measureRef])}
        className={`absolute z-20 w-48 bg-white shadow-lg`}
        style={{
          transform: `translate(${tx}px, ${ty}px)`,
        }}
      >
        {props.children}
      </div>
    </div>
  )
}
