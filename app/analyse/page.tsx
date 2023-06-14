"use client"
import { useOrderListData } from "../build/order/useOrderListData"
import ChassisCostChart from "./ui/ChassisCostChart"
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
          <ChassisCostChart />
          <FloorAreaChart />
          <CarbonEmissionsChart />
        </div>
      )
  }
}

export default AnalyseIndex
