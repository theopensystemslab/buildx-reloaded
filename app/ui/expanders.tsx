"use client"
import { PropsWithChildren } from "react"
import css from "./expanders.module.css"

type Props = {
  expanded: boolean
}

export const ExpandFromBottom = (props: PropsWithChildren<Props>) => {
  const { children, expanded = false } = props

  return (
    <div className={css.expandFromBottom} data-expanded={expanded}>
      {children}
    </div>
  )
}
