import DataInit from "@/data/DataInit"
import AppInit from "@/ui-3d/init/AppInit"
import { Fragment, ReactElement } from "react"
import GroupedApp from "@/ui-3d/grouped/GroupedApp"
import Layout from "@/ui/Layout"

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit>
        <AppInit>
          <GroupedApp />
        </AppInit>
      </DataInit>
    </Fragment>
  )
}

IndexPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default IndexPage
