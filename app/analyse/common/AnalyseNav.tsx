"use client"
import clsx from "clsx"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"

const links = [
  { href: "/analyse/overview", label: "Overview" },
  { href: "/analyse/areas", label: "Building Areas" },
  { href: "/analyse/costs", label: "Build Costs" },
]

const AnalyseNav = () => {
  const pathname = usePathname()
  return (
    <div className="flex w-full">
      {links.map(({ href, label }) => (
        <Link key={href} href={href}>
          <div
            className={clsx(
              href === pathname ? "border-b-grey-100" : "border-b-grey-30",
              "border-b px-5 py-1.5 font-semibold tracking-normal text-sm"
            )}
          >
            {label}
          </div>
        </Link>
      ))}
    </div>
  )
}

export default AnalyseNav
