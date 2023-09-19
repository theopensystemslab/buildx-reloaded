"use client"
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
    <AppInit controlsEnabled={true} mapEnabled={false}>
      <Routing />
      <FreshApp />
    </AppInit>
  )
}

export default App
