import Layout from "@/ui/Layout"
import dynamic from "next/dynamic"
import { ReactElement } from "react"

const Analyse = dynamic(() => import("@/ui/analyse/AnalyseIndex"), {
  ssr: false,
})

const AnalysePage = () => {
  return <Analyse />
}

AnalysePage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default AnalysePage
