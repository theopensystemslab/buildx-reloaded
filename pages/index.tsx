import DataInit from "@/data/DataInit"
import DefaultApp from "@/ui-3d/default/DefaultApp"
import AppInit from "@/ui-3d/init/AppInit"
import { Fragment, Suspense } from "react"

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit />
      <AppInit>
        <DefaultApp />
      </AppInit>
    </Fragment>
  )
}

export default IndexPage
