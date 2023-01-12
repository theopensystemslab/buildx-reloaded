import Layout from "@/ui/Layout"
import dynamic from "next/dynamic"
import { ReactElement } from "react"

// const Map = dynamic(() => import("@//map"), {
//   ssr: false,
// })

const MapPage = () => {
  return <div>hi</div>
}

MapPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>
}

export default MapPage
