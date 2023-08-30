import Link from "next/link"
import { PropsWithChildren, ReactNode, useRef } from "react"
import { useDebouncedCallback } from "use-debounce"
import css from "./ContextMenuButton.module.css"

type Props = {
  href?: string
  icon: ReactNode
  text: string
  unpaddedSvg?: boolean
  onClick?: () => void
  onHover?: (hovered: boolean) => void
}

const ContextMenuButton = (props: PropsWithChildren<Props>) => {
  const { href, children, icon, text, unpaddedSvg, onClick, onHover, ...rest } =
    props

  const lastHovered = useRef<boolean>(false)

  const nextHovered = useDebouncedCallback(
    (hovered: boolean) => {
      if (hovered === lastHovered.current) return
      lastHovered.current = hovered
      onHover?.(hovered)
    },
    100,
    { leading: true }
  )

  return href ? (
    <Link href={href} {...(rest as any)} className={css.root}>
      <span className={css.icon} data-unpadded-svg={unpaddedSvg}>
        {icon}
      </span>
      <span>{text}</span>
    </Link>
  ) : (
    <button
      className={css.root}
      onClick={onClick}
      onMouseOver={() => {
        nextHovered(true)
      }}
      onMouseOut={() => {
        nextHovered(false)
      }}
    >
      <span className={css.icon} data-unpadded-svg={unpaddedSvg}>
        {icon}
      </span>
      <span>{text}</span>
    </button>
  )
}

export default ContextMenuButton
