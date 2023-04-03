"use client"
import { useSiteCurrency } from "@/hooks/siteCtx"
import { ArrowUp } from "@carbon/icons-react"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { A, capitalizeFirstLetters, O, R } from "@/utils/functions"
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

  const totalCost = Object.values(orderListByBuilding).reduce(
    (acc, v) => acc + v.totalCost,
    0
  )

  const { symbol } = useSiteCurrency()

  function formatNumberWithK(number: number): string {
    if (number >= 1000) {
      return (number / 1000).toFixed(1) + "k"
    } else {
      return number.toString()
    }
  }

  return (
    <div className={clsx(css.chart)}>
      <div>
        <h2>Build cost</h2>
        <h5>Estimated £ GBP</h5>
        <div className="grid grid-cols-4 gap-4 border-b-2 border-black">
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
            className="scale-90 translate-y-[5%] text-white"
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
        <div className="grid grid-cols-2 gap-0 mt-8">
          <div className="flex justify-end mx-8">
            <div className="text-6xl font-normal">{`${symbol}${formatNumberWithK(
              totalCost
            )}`}</div>
          </div>
          <div className="text-5xl">
            <div>
              <span className="">
                <ArrowUp className="inline" width="1em" height="1em" />
                <span>{`10%`}</span>
              </span>
            </div>

            <div className="mt-4">
              <span>Compared to conventional new build</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default BuildCostChart
