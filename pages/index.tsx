import DataInit from "@/data/DataInit"
import R3FApp from "@/ui-3d/R3FApp"
import dynamic from "next/dynamic"
import { Fragment } from "react"

const R3FInit = dynamic(() => import("@/ui-3d/R3FInit"), {
  ssr: false,
})

const DataPreload = dynamic(() => import("@/data/DataPreload"), { ssr: false })

const IndexPage = () => {
  return (
    <Fragment>
      <DataInit />
      <R3FInit>
        <R3FApp />
        <DataPreload />
      </R3FInit>
    </Fragment>
  )
}

export default IndexPage
