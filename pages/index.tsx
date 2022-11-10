import DataInit from "@/data/DataInit"
import AppInit from "@/ui-3d/init/AppInit"
import { Fragment } from "react"
import BoxApp from "../src/ui-3d/box/BoxApp"

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit />
      <AppInit>
        <BoxApp />
      </AppInit>
    </Fragment>
  )
}

export default IndexPage
