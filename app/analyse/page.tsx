"use client"
import clsx from "clsx"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import React, { Fragment } from "react"
import { A, capitalizeFirstLetters, O, R } from "../../src/utils/functions"
import { OrderListRow, useOrderListData } from "../build/order/useOrderListData"
import {
  buildingColorVariants,
  useSelectedHouses,
} from "../common/HousesPillsSelector"
import BarChart from "./BarChart"
import Chart from "./Chart"
import ColumnOfDivs from "./ColumnOfDivs"
import css from "./page.module.css"

const BuildCostChart = () => {
  const { orderListData, fmt } = useOrderListData()
  // const useHouseBuildCosts = () => [
  //   {friendlyName: ""},
  //   // we need: name (-> shortened); color; value
  // ]

  // abstract custom hook with the data as in build order list
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

    // })
    // A.map((i, {colorClassName,buildingName}) => {
    //   return {
    //     colorClassName,
    //     shortName: capitalizeFirstLetters(buildingName),
    //   }
    // })
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
      <div
        // className={clsx(css.buildCost)}
        className="grid grid-cols-1 h-64"
        // style={{
        //   height: `${totalTotalCost / 10}px`,
        // }}
      >
        {pipe(
          orderListByBuilding,
          R.toArray,
          A.map(([buildingName, { totalCost, colorClassName }]) => {
            return (
              <div
                key={buildingName}
                style={{
                  gridRowEnd: `span ${Math.floor(
                    (totalCost / totalTotalCost) * 100
                  )}`,
                }}
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
        <ColumnOfDivs numbers={[1, 2, 3]} />
        <BuildCostChart />
        <FloorAreaChart />
        <CarbonEmissionsChart />
        {/* <Chart title="Floor Area" blueValue={5} greenValue={6} /> */}
        {/* <BarChart
          data={[
            { value: 5, color: "blue", content: "hey" },
            { value: 6, color: "green", content: "yo" },
          ]}
        /> */}
      </div>
    </Fragment>
  )
}

export default AnalyseIndex
