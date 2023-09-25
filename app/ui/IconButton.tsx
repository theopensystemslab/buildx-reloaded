import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/router"
import { HTMLProps, PropsWithChildren } from "react"
// import { Link, useLocation } from "react-router-dom";

export interface Props {
  onClick?: any
  href?: string
  className?: HTMLProps<HTMLAnchorElement>["className"]
}

export const iconButtonStyles =
  "w-12 inline-block h-12 hover:bg-[rgba(0,0,0,0.1)] transition-colors duration-200 ease-in-out focus:outline-none focus:shadow-[0 0 0 3px rgba(0,0,0,0.2))]"

const IconButton = (props: PropsWithChildren<Props>) => {
  const { href, children, onClick, ...restProps } = props
  const pathname = usePathname()
  // const location = useLocation();
  if (href) {
    const isActive = pathname?.startsWith(href) ?? false
    return (
      <Link
        href={href}
        className={`${iconButtonStyles} ${isActive ? "" : "opacity-50"}`}
        {...restProps}
      >
        <div>{children}</div>
      </Link>
    )
  }
  return (
    <button className={iconButtonStyles} onClick={onClick} {...restProps}>
      {children}
    </button>
  )
}

export default IconButton
