import { PropsWithChildren } from "react"
import { ExpandFromBottom } from "../ui/expanders"
import Footer from "../ui/Footer"
import css from "./layout.module.css"

const LocateLayout = (props: PropsWithChildren<{}>) => {
  const { children } = props

  return (
    <div className={css.root}>
      <div className={css.main}>{children}</div>
      <ExpandFromBottom>
        <Footer />
      </ExpandFromBottom>
    </div>
  )
}

export default LocateLayout
