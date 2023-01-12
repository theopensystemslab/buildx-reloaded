import css from "../../styles/ContextMenuButton.module.css"
import Link from "next/link"
import type { PropsWithChildren } from "react"
import { ReactNode } from "react"

type Props = {
  href?: string
  icon: ReactNode
  text: string
  unpaddedSvg?: boolean
  onClick?: () => void
}

const ContextMenuButton = (props: PropsWithChildren<Props>) => {
  const { href, children, icon, text, unpaddedSvg, ...rest } = props

  return href ? (
    <Link href={href} {...(rest as any)} className={css.root}>
      <span className={css.icon} data-unpadded-svg={unpaddedSvg}>
        {icon}
      </span>
      <span>{text}</span>
    </Link>
  ) : (
    <button className={css.root} {...(rest as any)}>
      <span className={css.icon} data-unpadded-svg={unpaddedSvg}>
        {icon}
      </span>
      <span>{text}</span>
    </button>
  )
}

export default ContextMenuButton
