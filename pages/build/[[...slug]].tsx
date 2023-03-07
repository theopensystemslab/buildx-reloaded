import Layout from "@/ui/Layout"
import dynamic from "next/dynamic"
import { ReactElement } from "react"

const Build = dynamic(() => import("@/ui/build/BuildIndex"), {
  ssr: false,
})

const BuildPage = () => {
  return <Build />
}

BuildPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default BuildPage
