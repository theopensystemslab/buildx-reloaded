"use client"
import DataInit from "~/data/DataInit"
import { TrpcProvider } from "../ui/TrpcProvider"
import { getLayoutsWorker, getSystemsWorker } from "../workers"
import { Routing } from "./state/routing"
import FreshApp from "./ui-3d/fresh/FreshApp"
import AppInit from "./ui-3d/init/AppInit"

const App = () => {
  getSystemsWorker()
  getLayoutsWorker()
  return (
    <TrpcProvider>
      <DataInit>
        <AppInit controlsEnabled={true} mapEnabled={false}>
          <Routing />
          <FreshApp />
        </AppInit>
      </DataInit>
    </TrpcProvider>
  )
}

export default App
