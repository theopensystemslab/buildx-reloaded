import DataInit from "@/data/DataInit"
import AppInit from "@/ui-3d/init/AppInit"
import { Fragment } from "react"
import DefaultApp from "@/ui-3d/default/DefaultApp"
import DemoApp from "@/ui-3d/demo/DemoApp"
import GroupedApp from "../src/ui-3d/grouped/GroupedApp"

const IndexPage = () => {
  // const { debug } = useGlobals()

  return (
    <Fragment>
      <DataInit>
        <AppInit>
          {/* <DefaultApp /> */}
          {/* {debug && <DebugDimensions />} */}
          <GroupedApp />
        </AppInit>
      </DataInit>
    </Fragment>
  )
}

export default IndexPage
