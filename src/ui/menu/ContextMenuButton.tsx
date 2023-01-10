import React, { ReactNode } from "react"
import type { HTMLProps } from "react"
// import { Link } from "wouter";
import Link from "next/link"

export interface Props extends HTMLProps<HTMLElement> {
  to?: string
  icon: ReactNode
  text: string
  carbon?: boolean
}

const styles =
  "flex items-center py-2 px-3 hover:bg-gray-100 w-full text-left text-sm whitespace-pre"

export default function ContextMenuButton(props: Props) {
  const { to, children, className, icon, text, carbon = false, ...rest } = props
  return to ? (
    <Link href={to} {...(rest as any)}>
      <a className={[styles, className].join(" ")}>
        <span className="w-6 h-6">{icon}</span>
        <span>{text}</span>
      </a>
    </Link>
  ) : (
    <button className={[styles, className].join(" ")} {...(rest as any)}>
      <span className={["w-6 h-6", carbon ? "" : "fix-custom-icon"].join(" ")}>
        {icon}
      </span>
      <span>{text}</span>
    </button>
  )
}
