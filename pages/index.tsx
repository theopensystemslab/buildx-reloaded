import DataInit from "@/data/DataInit"
import BoxApp from "@/ui-3d/box/BoxApp"
import AppInit from "@/ui-3d/init/AppInit"
import dynamic from "next/dynamic"
import { Fragment } from "react"
import DebugApp from "../src/ui-3d/debug/DebugApp"
import InstancedApp from "../src/ui-3d/instanced/InstancedApp"

const IfcApp = dynamic(() => import("@/ui-3d/ifc/IfcApp"), {
  ssr: false,
})

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit />
      <AppInit>
        {/* <BoxApp /> */}
        {/* <DebugApp /> */}
        {/* <InstancedApp /> */}
        <IfcApp />
      </AppInit>
    </Fragment>
  )
}

export default IndexPage
