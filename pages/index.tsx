import R3FApp from "@/ui-3d/R3FApp"
import dynamic from "next/dynamic"
import { Fragment } from "react"
import { useInitSystemModules } from "../src/hooks/modules"

const R3FInit = dynamic(() => import("@/ui-3d/R3FInit"), {
  ssr: false,
})

const DataFiller = () => {
  useInitSystemModules({ systemId: "skylark" })
  return null
}

const IndexPage = () => {
  return (
    <Fragment>
      <R3FInit>
        <R3FApp />
      </R3FInit>
      <DataFiller />
    </Fragment>
  )
}

export default IndexPage
