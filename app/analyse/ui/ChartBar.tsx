import { A } from "@/utils/functions"
import { floor } from "@/utils/math"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import React, { HTMLAttributes } from "react"

type Props<T> = {
  items: T[]
  itemToValue: (x: T) => number
  itemToString?: (x: T) => string
  itemToKey?: (x: T) => string
  itemToColorClass: (x: T) => string
  renderItem?: (x: T) => React.ReactNode
  className?: HTMLAttributes<HTMLDivElement>["className"]
  reverse?: boolean
}

const ChartBar = <T extends unknown>(props: Props<T>) => {
  const {
    items: _items,
    itemToString = (item) => JSON.stringify(item),
    itemToValue,
    itemToKey = itemToString,
    itemToColorClass,
    renderItem,
    className,
    reverse = false,
  } = props

  const items = reverse ? _items : A.reverse(_items)

  const total = items.reduce((acc, v) => acc + itemToValue(v), 0)

  const gridTemplateRows = `${pipe(
    items,
    A.map(
      (item) =>
        `minmax(auto,${pipe(
          item,
          itemToValue,
          (x) => (x * 100) / total,
          floor
        )}fr)`
    )
  ).join(" ")}`

  const style = {
    gridTemplateRows,
  }

  return (
    <div
      className={clsx(
        `grid grid-cols-1 font-medium leading-6 tracking-wide`,
        className
      )}
      style={style}
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

export default ChartBar
