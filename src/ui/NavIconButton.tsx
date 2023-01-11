import Link from "next/link"
import { useRouter } from "next/router"
import { PropsWithChildren } from "react"
import css from "@/styles/NavIconButton.module.css"

type Props = {
  onClick?: () => void
  href?: string
}

const NavIconButton = (props: PropsWithChildren<Props>) => {
  const { href, children, onClick, ...restProps } = props
  const router = useRouter()
  if (href) {
    const isActive = router.pathname.startsWith(href)
    return (
      <Link
        href={href}
        className={css.root}
        data-active={isActive}
        {...restProps}
      >
        <div>{children}</div>
      </Link>
    )
  }
  return (
    <button className={css.root} onClick={onClick} {...restProps}>
      {children}
    </button>
  )
}

export default NavIconButton
