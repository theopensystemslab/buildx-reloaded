"use client"
import { useOrderListData } from "../build/order/useOrderListData"
import Loader from "../ui/Loader"
import css from "./page.module.css"
import CarbonEmissionsChart from "./ui/CarbonEmissionsChart"
import ChassisCostChart from "./ui/ChassisCostChart"
import FloorAreaChart from "./ui/FloorAreaChart"

const AnalyseIndex = () => {
  const { status } = useOrderListData()

  switch (status) {
    case "error":
    case "loading":
      return <Loader />
    default:
    case "success":
      return (
        <div className={css.pageRoot}>
          <ChassisCostChart />
          <FloorAreaChart />
          <CarbonEmissionsChart />
        </div>
      )
  }
}

export default AnalyseIndex
