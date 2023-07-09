"use client"
import dynamic from "next/dynamic"

const DebugApp = dynamic(() => import("./app"), { ssr: false })

const IndexPage = () => {
  return <DebugApp />
}

export default IndexPage
