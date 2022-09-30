import DataInit from "@/data/DataInit"
import BoxApp from "@/ui-3d/box/BoxApp"
import AppInit from "@/ui-3d/init/AppInit"
import { Fragment } from "react"

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
