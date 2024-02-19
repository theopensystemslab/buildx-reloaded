"use client"
import { useIndexedSiteCtx } from "~/design/state/siteCtx"
import { useAllHouseTypes } from "../db/systems"
import Loader from "../ui/Loader"
import {
  initExportersWorker,
  initLayoutsWorker,
  initModelsWorker,
  initSystemsWorker,
} from "../workers"
import AppInit from "./ui-3d/AppInit"
import ThreeboxApp from "./ui-3d/ThreeboxApp"

const App = () => {
  initSystemsWorker()
  initModelsWorker()
  initLayoutsWorker()
  initExportersWorker()

  useIndexedSiteCtx()

  const houseTypes = useAllHouseTypes()

  return houseTypes.length > 0 ? (
    <AppInit controlsEnabled={true} mapEnabled={false}>
      <ThreeboxApp />
    </AppInit>
  ) : (
    <Loader />
  )
}

export default App
