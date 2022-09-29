import DataInit from "@/data/DataInit"
import { Fragment } from "react"
import { App, AppInit } from "@/ui-3d/entry"
import dynamic from "next/dynamic"

const TestIfcApp = dynamic(() => import("@/ui-3d/ifc/TestIfcApp"), {
  ssr: false,
})

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit />
      <AppInit>
        {/* <App /> */}
        <TestIfcApp />
      </AppInit>
    </Fragment>
  )
}

export default IndexPage
