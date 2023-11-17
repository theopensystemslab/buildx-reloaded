"use client"
import { useAllHouseTypes } from "../../db/systems"
import { useIndexedSiteCtx } from "../../design/state/siteCtx"
import FreshApp from "../../design/ui-3d/fresh/FreshApp"
import AppInit from "../../design/ui-3d/init/AppInit"
import Loader from "../../ui/Loader"
import {
  initExportersWorker,
  initLayoutsWorker,
  initModelsWorker,
  initSystemsWorker,
} from "../../workers"

const HousesView = () => {
  initSystemsWorker()
  initModelsWorker()
  initLayoutsWorker()
  initExportersWorker()

  useIndexedSiteCtx()

  const houseTypes = useAllHouseTypes()

  return houseTypes.length > 0 ? (
    <AppInit controlsEnabled={false} mapEnabled={false}>
      {/* <Routing /> */}
      <FreshApp />
    </AppInit>
  ) : (
    <Loader />
  )
}

export default HousesView
