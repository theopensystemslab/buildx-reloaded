import DataInit from "@/data/DataInit"
import AppInit from "@/ui-3d/init/AppInit"
import { Fragment } from "react"
import GroupedApp from "../src/ui-3d/grouped/GroupedApp"

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit />
      <AppInit>
        <GroupedApp />
      </AppInit>
      {/* </DataInit> */}
    </Fragment>
  )
}

export default IndexPage
