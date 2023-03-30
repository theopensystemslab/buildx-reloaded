"use client"
import clsx from "clsx"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { A, capitalizeFirstLetters, O, R } from "../../src/utils/functions"
import { OrderListRow, useOrderListData } from "../build/order/useOrderListData"
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
    // TODO: typical costs for each building
    // R.map(({totalCost, ...rest}) => ({

    // }))
  )

  const totalTotalCost = pipe(
    orderListByBuilding,
    values,
    A.reduce(0, (acc, x) => acc + x.totalCost)
  )

  return (
    <div className={clsx(css.chart)}>
      <h3>Build cost</h3>
      <p>Estimated £ GBP</p>
      <div className="flex justify-center">
        <div
          className="grid grid-cols-1"
          style={{
            gridTemplateRows: `${pipe(
              orderListByBuilding,
              values,
              A.map(
                (x) => `${Math.floor((x.totalCost / totalTotalCost) * 100)}fr`
              )
            ).join(" ")}`,
          }}
        >
          {pipe(
            orderListByBuilding,
            R.toArray,
            A.map(([buildingName, { totalCost, colorClassName }]) => {
              return (
                <div
                  key={buildingName}
                  className={clsx(
                    "flex flex-col justify-center  items-center px-2",
                    colorClassName
                  )}
                >
                  <div>{capitalizeFirstLetters(buildingName)}</div>
                  <div>{fmt(totalCost)}</div>
                </div>
              )
            })
          )}
        </div>
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
