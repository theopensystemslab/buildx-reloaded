"use client"
import { Fragment, PropsWithChildren, useState } from "react"
import { ExpandFromBottom } from "../ui/expanders"
import Footer from "../ui/Footer"
import IconButton from "../ui/IconButton"
import { Close, Info } from "../ui/icons"
import css from "./layout.module.css"

const LocateLayout = (props: PropsWithChildren<{}>) => {
  const { children } = props

  const [footerExpanded, setFooterExpanded] = useState(false)

  return (
    <Fragment>
      <div className={css.main}>{children}</div>
      <div className="absolute left-0 z-50 bottom-0 text-white">
        <IconButton
          onClick={() => {
            setFooterExpanded((prev) => !prev)
          }}
        >
          {footerExpanded ? <Close /> : <Info />}
        </IconButton>
      </div>
      <ExpandFromBottom expanded={footerExpanded}>
        <Footer />
      </ExpandFromBottom>
    </Fragment>
  )
}

export default LocateLayout
