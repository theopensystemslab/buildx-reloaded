"use client"
import { useOrderListData } from "../build/order/useOrderListData"
import BuildCostChart from "./components/BuildCostChart"
import CarbonEmissionsChart from "./components/CarbonEmissionsChart"
import FloorAreaChart from "./components/FloorAreaChart"
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
