import { Fragment, PropsWithChildren } from "react"
import { ExpandFromBottom } from "../ui/expanders"
import Footer from "../ui/Footer"
import css from "./layout.module.css"

const LocateLayout = (props: PropsWithChildren<{}>) => {
  const { children } = props

  return (
    <Fragment>
      <div className={css.main}>{children}</div>
      <ExpandFromBottom>
        <Footer />
      </ExpandFromBottom>
    </Fragment>
  )
}

export default LocateLayout
