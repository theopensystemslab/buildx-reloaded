"use client"
import { ArrowUp } from "@carbon/icons-react"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useSiteCurrency } from "../../src/hooks/siteCtx"
import { A, capitalizeFirstLetters, O, R } from "../../src/utils/functions"
import { OrderListRow, useOrderListData } from "../build/order/useOrderListData"
import BuildCostChart from "./BuildCostChart"
import BuildCostsChartBar from "./BuildCostsChartBar"
import css from "./page.module.css"

const FloorAreaChart = () => {
  return (
    <div className={clsx(css.chart)}>
      <div>
        <h2>Floor area</h2>
        <h5>Gross internal m²</h5>
      </div>
    </div>
  )
}

const CarbonEmissionsChart = () => {
  return (
    <div className={clsx(css.chart)}>
      <div>
        <h2>Carbon emissions</h2>
        <h5>Gross internal m²</h5>
      </div>
      <div className="grid grid-rows-2"></div>
    </div>
  )
}

const AnalyseIndex = () => {
  return (
    <Fragment>
      <div className="w-full h-full flex justify-start items-center space-x-5">
        <BuildCostChart />
        <FloorAreaChart />
        <CarbonEmissionsChart />
      </div>
    </Fragment>
  )
}

export default AnalyseIndex
