"use client"
import clsx from "clsx"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"

const links = [
  { href: "/build/overview", label: "Overview" },
  { href: "/build/order", label: "Order list" },
  { href: "/build/materials", label: "Materials list" },
]

const BuildNav = () => {
  const pathname = usePathname()
  return (
    <div className="h-full w-60">
      {links.map(({ href, label }) => (
        <Link key={href} href={href}>
          <div
            className={clsx(
              href === pathname ? "bg-grey-90 text-white" : "text-grey-70",
              "px-5 py-1.5 font-semibold tracking-normal text-sm"
            )}
          >
            {label}
          </div>
        </Link>
      ))}
    </div>
  )
}

export default BuildNav
