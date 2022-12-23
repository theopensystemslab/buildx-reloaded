import DataInit from "@/data/DataInit"
import AppInit from "@/ui-3d/init/AppInit"
import { Fragment } from "react"
import DefaultApp from "@/ui-3d/default/DefaultApp"
import DemoApp from "@/ui-3d/demo/DemoApp"

const IndexPage = () => {
  // const { debug } = useGlobals()

  return (
    <Fragment>
      <DataInit>
        <AppInit>
          {/* <DefaultApp /> */}
          {/* {debug && <DebugDimensions />} */}
          <DemoApp />
        </AppInit>
      </DataInit>
    </Fragment>
  )
}

export default IndexPage
