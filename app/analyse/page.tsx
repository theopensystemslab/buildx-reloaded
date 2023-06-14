"use client"
import { pipe } from "fp-ts/lib/function"
import { A, O, R } from "~/utils/functions"
import { OrderListRow, useOrderListData } from "../build/order/useOrderListData"
import { useSiteCurrency } from "../design/state/siteCtx"
import css from "./page.module.css"
import CarbonEmissionsChart from "./ui/CarbonEmissionsChart"
import ChassisCostChart from "./ui/ChassisCostChart"

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
        <div className={css.pageRoot}>
          <ChassisCostChart />
          <CarbonEmissionsChart />
          {/* <FloorAreaChart /> */}
        </div>
      )
  }
}

export default AnalyseIndex
