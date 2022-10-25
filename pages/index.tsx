import DataInit from "@/data/DataInit"
import BoxApp from "@/ui-3d/box/BoxApp"
import AppInit from "@/ui-3d/init/AppInit"
import { Fragment } from "react"
import DebugApp from "../src/ui-3d/debug/DebugApp"
import InstancedApp from "../src/ui-3d/instanced/InstancedApp"

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit />
      <AppInit>
        {/* <BoxApp />
        <DebugApp /> */}
        <InstancedApp />
      </AppInit>
    </Fragment>
  )
}

export default IndexPage
