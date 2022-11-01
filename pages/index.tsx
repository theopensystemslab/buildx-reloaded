import DataInit from "@/data/DataInit"
import AppInit from "@/ui-3d/init/AppInit"
import { Fragment } from "react"
import GltfApp from "../src/ui-3d/gltf/GltfApp"

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit />
      <AppInit>
        {/* <BoxApp />
        <DebugApp /> */}
        {/* <InstancedApp /> */}
        <GltfApp />
      </AppInit>
    </Fragment>
  )
}

export default IndexPage
