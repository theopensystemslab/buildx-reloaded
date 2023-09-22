import React, { useState } from "react"

type Metric = {
  label: string
  value: number
  unit?: string
  displayFn?: (unit: string, value: number) => string
}

const MetricsCarousel = ({ metrics }: { metrics: Metric[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextMetric = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % metrics.length)
  }

  const prevMetric = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + metrics.length) % metrics.length
    )
  }

  const { label, value, unit = "", displayFn } = metrics[currentIndex]

  const defaultDisplayFn = (unit: string | undefined, value: number) => {
    return unit ? `${value} ${unit}` : `${value}`
  }

  const displayValue = (displayFn || defaultDisplayFn)(unit, value)

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        <button onClick={prevMetric} className="p-2 pointer-events-auto">
          {`<`}
        </button>
        <div className="text-xs">{label}</div>
        <button onClick={nextMetric} className="p-2 pointer-events-auto">
          {`>`}
        </button>
      </div>
      <div className="mt-1 font-bold text-lg">{displayValue}</div>
    </div>
  )
}

export default MetricsCarousel
