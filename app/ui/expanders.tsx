"use client"
import { PropsWithChildren, useState } from "react"
import { useInterval } from "react-use"
import css from "./expanders.module.css"

export const ExpandFromBottom = (props: PropsWithChildren<{}>) => {
  const { children } = props

  const [expanded, setExpanded] = useState(true)

  useInterval(() => setExpanded((p) => !p), 2000)

  return (
    <div className={css.expandFromBottom} data-expanded={expanded}>
      {children}
    </div>
  )
}
