"use client"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { A, capitalizeFirstLetters, O, R } from "../../src/utils/functions"
import { OrderListRow, useOrderListData } from "../build/order/useOrderListData"
import BuildCostsChartBar from "./BuildCostsChartBar"
import css from "./page.module.css"

const BuildCostChart = () => {
  const { orderListData, fmt } = useOrderListData()

  const orderListByBuilding = pipe(
    orderListData,
    A.reduce({}, (acc: Record<string, OrderListRow>, x) =>
      pipe(
        acc,
        R.modifyAt(
          x.buildingName,
          ({ totalCost, ...rest }: OrderListRow): OrderListRow => ({
            ...rest,
            totalCost: totalCost + x.totalCost,
          })
        ),
        O.getOrElse(() => pipe(acc, R.upsertAt(x.buildingName, x)))
      )
    )
  )

  return (
    <div className={clsx(css.chart)}>
      <h3>Build cost</h3>
      <p>Estimated £ GBP</p>
      <div className="grid grid-cols-4 gap-4">
        <div />
        <BuildCostsChartBar
          items={Object.values(orderListByBuilding)}
          itemToColorClass={(item) => item.colorClass}
          itemToValue={(item) => item.totalCost}
          itemToKey={(item) => item.buildingName}
          renderItem={(item) => (
            <div className="flex flex-col justify-center  items-center px-2">
              <div>{capitalizeFirstLetters(item.buildingName)}</div>
              <div>{fmt(item.totalCost)}</div>
            </div>
          )}
        />
        <BuildCostsChartBar
          className="scale-90 translate-y-[5%]"
          items={Object.values(orderListByBuilding)}
          itemToColorClass={(item) => item.staleColorClass}
          itemToValue={(item) => (item.totalCost / 100) * 90}
          itemToKey={(item) => item.buildingName}
          renderItem={(item) => (
            <div className="flex flex-col justify-center  items-center px-2">
              <div>{capitalizeFirstLetters(item.buildingName)}</div>
              <div>{fmt((item.totalCost / 100) * 90)}</div>
            </div>
          )}
        />
        <div />
      </div>
    </div>
  )
}

const FloorAreaChart = () => {
  return (
    <div className={clsx(css.chart)}>
      <h3>Floor area</h3>
      <div></div>
    </div>
  )
}

const CarbonEmissionsChart = () => {
  return (
    <div className={clsx(css.chart)}>
      <h3>Carbon emissions</h3>
      <div></div>
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
