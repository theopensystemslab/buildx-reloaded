"use client"
import dynamic from "next/dynamic"
import DataInit from "~/data/DataInit"
import AppInit from "~/design/ui-3d/init/AppInit"
import { TrpcProvider } from "../../ui/TrpcProvider"
import Leva from "../ui/Leva"

const DebugSystemApp = dynamic(() => import("./ui-3d/DebugSystemApp"), {
  ssr: false,
})

const IndexPage = () => {
  return (
    <TrpcProvider>
      <DataInit>
        <AppInit controlsEnabled={true} mapEnabled={false}>
          <DebugSystemApp />
        </AppInit>
        <Leva />
      </DataInit>
    </TrpcProvider>
  )
}

export default IndexPage
