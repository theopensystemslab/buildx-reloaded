"use client"
import dynamic from "next/dynamic"
import { PropsWithChildren } from "react"
import { useAllHouseTypes } from "../db/systems"
import { useIndexedSiteCtx } from "../design/state/siteCtx"
import Loader from "../ui/Loader"
import {
  initExportersWorker,
  initLayoutsWorker,
  initModelsWorker,
  initSystemsWorker,
} from "../workers"
import { useOrderListData } from "../db/user"
import { useAnalyseData } from "./state/data"
import CarbonEmissionsChart from "./ui/CarbonEmissionsChart"
import ChassisCostChart from "./ui/ChassisCostChart"
import FloorAreaChart from "./ui/FloorAreaChart"
import HousesPillsSelector from "./ui/HousesPillsSelector"
import css from "./app.module.css"

const AnalyseIndex = () => {
  const { orderListRows } = useOrderListData()
  const analyseData = useAnalyseData()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex-grow-0">
        <HousesPillsSelector />
      </div>
      <div className="flex-auto">
        <div className={css.pageRoot}>
          <ChassisCostChart orderListRows={orderListRows} />
          <FloorAreaChart analyseData={analyseData} />
          <CarbonEmissionsChart analyseData={analyseData} />
        </div>
      </div>
    </div>
  )
}
const AnalyseApp = () => {
  initSystemsWorker()
  initModelsWorker()
  initLayoutsWorker()
  initExportersWorker()

  useIndexedSiteCtx()

  const houseTypes = useAllHouseTypes()

  return houseTypes.length > 0 ? <AnalyseIndex /> : <Loader />
}

export default AnalyseApp
