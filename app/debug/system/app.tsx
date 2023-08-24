"use client"
import DataInit from "~/data/DataInit"
import AppInit from "~/design/ui-3d/init/AppInit"
import { TrpcProvider } from "../../ui/TrpcProvider"
import Leva from "../ui/Leva"
import DebugSystemApp from "./ui-3d/DebugSystemApp"

const DebugApp = () => {
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

export default DebugApp
