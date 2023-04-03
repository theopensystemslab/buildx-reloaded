"use client"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import React, { HTMLAttributes } from "react"
import { A } from "../../src/utils/functions"
import { floor } from "../../src/utils/math"

type Props<T> = {
  items: T[]
  itemToValue: (x: T) => number
  itemToString?: (x: T) => string
  itemToKey?: (x: T) => string
  itemToColorClass: (x: T) => string
  renderItem?: (x: T) => React.ReactNode
  className?: HTMLAttributes<HTMLDivElement>["className"]
}

const BuildCostsChartBar = <T extends unknown>(props: Props<T>) => {
  const {
    items,
    itemToString = (item) => JSON.stringify(item),
    itemToValue,
    itemToKey = itemToString,
    itemToColorClass,
    renderItem,
    className,
  } = props

  const total = items.reduce((acc, v) => acc + itemToValue(v), 0)

  const gridTemplateRows = `${pipe(
    items,
    A.map(
      (item) => `${pipe(item, itemToValue, (x) => (x * 100) / total, floor)}fr`
    )
  ).join(" ")}`

  return (
    <div
      className={clsx(
        `grid grid-cols-1 font-semibold leading-6 tracking-wide`,
        className
      )}
      style={{
        gridTemplateRows,
      }}
    >
      {pipe(
        items,
        A.map((item) => {
          return (
            <div
              key={itemToKey(item)}
              className={clsx(
                "flex flex-col justify-center items-center px-2",
                itemToColorClass(item)
              )}
            >
              {renderItem ? renderItem(item) : itemToString(item)}
            </div>
          )
        })
      )}
    </div>
  )
}

export default BuildCostsChartBar
