"use client"
import { useOrderListData } from "../build/order/useOrderListData"
import BuildCostChart from "./ui/BuildCostChart"
import CarbonEmissionsChart from "./ui/CarbonEmissionsChart"
import FloorAreaChart from "./ui/FloorAreaChart"
import css from "./page.module.css"

const AnalyseIndex = () => {
  const { status } = useOrderListData()

  switch (status) {
    case "error":
      return "error"
    case "loading":
      return "loading"
    default:
    case "success":
      return (
        <div className={css.root}>
          <BuildCostChart />
          <FloorAreaChart />
          <CarbonEmissionsChart />
        </div>
      )
  }
}

export default AnalyseIndex
