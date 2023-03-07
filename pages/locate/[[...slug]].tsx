import Layout from "@/ui/Layout"
import dynamic from "next/dynamic"
import { ReactElement } from "react"

const Locate = dynamic(() => import("@/ui/locate"), {
  ssr: false,
})

const LocatePage = () => {
  return <Locate />
}

LocatePage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default LocatePage
