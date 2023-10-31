"use client"
import { useOrderListData } from "../build/order/useOrderListData"
import css from "./app.module.css"
import { useAnalyseData } from "./state/data"
import CarbonEmissionsChart from "./ui/CarbonEmissionsChart"
import ChassisCostChart from "./ui/ChassisCostChart"
import FloorAreaChart from "./ui/FloorAreaChart"
import { useSelectedHouses } from "./ui/HousesPillsSelector"

const AnalyseIndex = () => {
  const selectedHouses = useSelectedHouses()
  const { orderListRows } = useOrderListData(selectedHouses)
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
