"use client"
import DataInit from "~/data/DataInit"
import { TrpcProvider } from "../ui/TrpcProvider"
import {
  initLayoutsWorker,
  initModelsWorker,
  initSystemsWorker,
} from "../workers"
import { Routing } from "./state/routing"
import FreshApp from "./ui-3d/fresh/FreshApp"
import AppInit from "./ui-3d/init/AppInit"

const App = () => {
  initSystemsWorker()
  initModelsWorker()
  initLayoutsWorker()
  return (
    <TrpcProvider>
      <AppInit controlsEnabled={true} mapEnabled={false}>
        <Routing />
        <FreshApp />
      </AppInit>
    </TrpcProvider>
  )
}

export default App
