"use client"
import { useOrderListData } from "../db/user"
import css from "./app.module.css"
import { useAnalyseData } from "./state/data"
import CarbonEmissionsChart from "./ui/CarbonEmissionsChart"
import ChassisCostChart from "./ui/ChassisCostChart"
import FloorAreaChart from "./ui/FloorAreaChart"

const AnalyseIndex = () => {
  const { orderListRows } = useOrderListData()
  const analyseData = useAnalyseData()

  return (
    <div className={css.pageRoot}>
      <ChassisCostChart orderListRows={orderListRows} />
      <FloorAreaChart analyseData={analyseData} />
      <CarbonEmissionsChart analyseData={analyseData} />
    </div>
  )
}

export default AnalyseIndex
