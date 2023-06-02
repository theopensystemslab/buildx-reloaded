"use client"
import { Fragment, PropsWithChildren } from "react"
import Footer from "../ui/Footer"
import css from "./layout.module.css"

const LocateLayout = (props: PropsWithChildren<{}>) => {
  const { children } = props

  return (
    <Fragment>
      <div className={css.main}>{children}</div>
      <Footer />
    </Fragment>
  )
}

export default LocateLayout
