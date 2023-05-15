import React, { HTMLProps } from "react"

const HtmlPortalContainer = (props: HTMLProps<HTMLDivElement>) => {
  return <div {...props} />
}

export default HtmlPortalContainer
