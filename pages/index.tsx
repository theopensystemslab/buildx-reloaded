import DataInit from "@/data/DataInit"
import DefaultApp from "@/ui-3d/default/DefaultApp"
import AppInit from "@/ui-3d/init/AppInit"
import { Fragment } from "react"
import { useGlobals } from "../src/hooks/globals"
import DebugDimensions from "../src/ui-3d/debug/DebugDimensions"

const IndexPage = () => {
  const { debug } = useGlobals()

  return (
    <Fragment>
      <DataInit>
        <AppInit>
          <DefaultApp />
          {/* {debug && <DebugDimensions />} */}
        </AppInit>
      </DataInit>
    </Fragment>
  )
}

export default IndexPage
