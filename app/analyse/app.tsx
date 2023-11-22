"use client"
import { useOrderListData } from "../db/exports"
import css from "./app.module.css"
import { useAnalyseData } from "./state/data"
import CarbonEmissionsChart from "./ui/CarbonEmissionsChart"
import ChassisCostChart from "./ui/ChassisCostChart"
import FloorAreaChart from "./ui/FloorAreaChart"
import HousesPillsSelector from "./ui/HousesPillsSelector"

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

export default AnalyseIndex
