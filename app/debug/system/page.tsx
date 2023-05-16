"use client"
import dynamic from "next/dynamic"
import DataInit from "~/data/DataInit"
import AppInit from "~/design/ui-3d/init/AppInit"

const DebugSystemApp = dynamic(() => import("./ui-3d/DebugSystemApp"), {
  ssr: false,
})

const IndexPage = () => {
  return (
    <DataInit>
      <AppInit controlsEnabled={true} mapEnabled={false}>
        <DebugSystemApp />
      </AppInit>
    </DataInit>
  )
}

export default IndexPage
