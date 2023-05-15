"use client"
import Link from "next/link"
import { ReactNode } from "react"
import css from "./NavIconButton.module.css"
import { usePathname } from "next/navigation"

type Props = {
  onClick?: () => void
  href?: string
  icon: ReactNode
  order?: number
  label?: string
  unpaddedSvg?: boolean
}

const NavIconButton = (props: Props) => {
  const { href, icon, order, label, onClick, unpaddedSvg, ...restProps } = props

  const pathname = usePathname()

  if (href) {
    const isActive =
      href === "/" ? pathname === href : pathname?.startsWith(href) ?? false
    return (
      <Link
        href={href}
        className={css.root}
        data-active={isActive}
        {...restProps}
      >
        <div className={css.order}>{order ?? ""}</div>
        <div className={css.icon} data-unpadded-svg={unpaddedSvg}>
          {icon}
        </div>
        <div className={css.label}>{label ?? ""}</div>
      </Link>
    )
  }
  return (
    <button className={css.root} onClick={onClick} {...restProps}>
      <div className={css.order}>{order ?? ""}</div>
      <div className={css.icon}>{icon}</div>
      <div className={css.label}>{label ?? ""}</div>
    </button>
  )
}

export default NavIconButton
