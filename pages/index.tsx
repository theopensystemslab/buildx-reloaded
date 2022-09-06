import R3FApp from "@/ui-3d/R3FApp"
import dynamic from "next/dynamic"
import React from "react"

const R3FInit = dynamic(() => import("@/ui-3d/R3FInit"), {
  ssr: false,
})

const IndexPage = () => {
  return (
    <R3FInit>
      <R3FApp />
    </R3FInit>
  )
}

export default IndexPage
