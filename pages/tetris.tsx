import R3FApp from "@/ui-3d/R3FApp"
import dynamic from "next/dynamic"
import React from "react"

const R3FInitWrapper = dynamic(() => import("@/ui-3d/R3FInitWrapper"), {
  ssr: false,
})

const Tetris = () => {
  return (
    <R3FInitWrapper>
      <R3FApp />
    </R3FInitWrapper>
  )
}

export default Tetris
