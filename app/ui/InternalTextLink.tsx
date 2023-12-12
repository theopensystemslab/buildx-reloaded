import { ArrowDown } from "@carbon/icons-react"
import Link from "next/link"
import React from "react"

type Props = {
  href: string
  label: string
}

const InternalTextLink = (props: Props) => {
  const { href, label } = props
  return (
    <Link href={href}>
      <div className="inline-block border-b border-transparent hover:border-white">
        <div className="flex font-semibold items-center ">
          <span>{label}</span>
          <span>
            <ArrowDown size="20" className="rotate-[225deg]" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default InternalTextLink
