import { ArrowDown } from "@carbon/icons-react"
import React from "react"

type Props = {
  href: string
  label: string
}

const ExternalTextLink = (props: Props) => {
  const { href, label } = props
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="inline-block border-b border-transparent hover:border-white">
        <div className="flex font-semibold items-center ">
          <span>{label}</span>
          <span>
            <ArrowDown size="20" className="ml-1 rotate-[225deg]" />
          </span>
        </div>
      </div>
    </a>
  )
}

export default ExternalTextLink
