import DataInit from "@/data/DataInit"
import { Fragment } from "react"
import { App, AppInit } from "@/ui-3d/entry"

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit />
      <AppInit>
        <App />
      </AppInit>
    </Fragment>
  )
}

export default IndexPage
