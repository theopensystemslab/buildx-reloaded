import DataInit from "@/data/DataInit"
import Layout from "@/ui/Layout"
import dynamic from "next/dynamic"
import { Fragment, ReactElement } from "react"
import AppInit from "../src/ui-3d/init/AppInit"

const Foo = dynamic(() => import("@/Foo"), { ssr: false })

const IfcTestPage = () => {
  return (
    <Fragment>
      <DataInit>
        <AppInit>
          <Foo />
        </AppInit>
      </DataInit>
    </Fragment>
  )
}

IfcTestPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default IfcTestPage
