import type { ReactNode } from "react"
import { useState } from "react"
import useMeasure from "react-use-measure"
import { useWindowSize } from "usehooks-ts"
import css from "./ContextMenuNested.module.css"
import clsx from "clsx"

export interface Props {
  icon: ReactNode
  label: string
  children?: ReactNode
  long?: boolean
  unpaddedSvg?: boolean
}

export default function ContextMenuNested(props: Props) {
  const [hovered, setHovered] = useState(false)

  const [labelRef, labelDims] = useMeasure()
  const [menuRef, menuDims] = useMeasure()

  const windowSize = useWindowSize()

  const flip = menuDims.right > windowSize.width + menuDims.width / 2

  const y0 = -labelDims.height

  const ty =
    menuDims.top < 0
      ? y0
      : menuDims.bottom > windowSize.height
      ? -(menuDims.bottom - windowSize.height - y0)
      : y0

  console.log({ children: props.children })

  return (
    <div
      className={clsx(css.root, { ["text-grey-40"]: !props.children })}
      onMouseEnter={() => {
        setHovered(true)
      }}
      onMouseLeave={() => {
        setHovered(false)
      }}
      ref={labelRef}
    >
      <div className={css.level1}>
        <span
          className={css.icon}
          data-unpadded-svg={props.unpaddedSvg ?? false}
        >
          {props.icon}
        </span>
        <span>{props.label}</span>
      </div>
      {hovered ? (
        <div
          ref={menuRef}
          className={`absolute ${
            flip ? "right-full" : "left-full"
          } z-20 bg-white ${props.long ? "w-64" : "w-48"}`}
          style={{
            transform: `translate(${0}px, ${ty}px)`,
          }}
        >
          {props.children}
        </div>
      ) : null}
    </div>
  )
}
