"use client"
import { useAllHouseTypes } from "../db/systems"
import Loader from "../ui/Loader"
import {
  initOutputsWorker,
  initLayoutsWorker,
  initModelsWorker,
  initSystemsWorker,
  initFilesWorker,
} from "../workers"
import { Routing } from "./state/routing"
import { useIndexedSiteCtx } from "./state/siteCtx"
import FreshApp from "./ui-3d/fresh/FreshApp"
import AppInit from "./ui-3d/init/AppInit"

const App = () => {
  initSystemsWorker()
  initModelsWorker()
  initLayoutsWorker()
  initOutputsWorker()
  initFilesWorker()

  useIndexedSiteCtx()

  const houseTypes = useAllHouseTypes()

  return houseTypes.length > 0 ? (
    <AppInit controlsEnabled={true} mapEnabled={false}>
      <Routing />
      <FreshApp controlsEnabled />
    </AppInit>
  ) : (
    <Loader />
  )
}

export default App
