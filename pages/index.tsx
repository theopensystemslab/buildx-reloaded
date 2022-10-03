import DataInit from "@/data/DataInit"
import AppInit from "@/ui-3d/init/AppInit"
import dynamic from "next/dynamic"
import { Fragment } from "react"

const IfcApp = dynamic(() => import("@/ui-3d/ifc/IfcApp"), { ssr: false })

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit />
      <AppInit>
        <IfcApp />
      </AppInit>
    </Fragment>
  )
}

export default IndexPage
