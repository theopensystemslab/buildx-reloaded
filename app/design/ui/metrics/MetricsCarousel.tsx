import React, { useState } from "react"

export type Metric = {
  label: string
  value: number
  unit?: string
  displayFn?: (value: number, unit?: string) => string
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

  const defaultDisplayFn = (value: number, unit?: string) => {
    return unit ? `${value} ${unit}` : `${value}`
  }

  const displayValue = (displayFn || defaultDisplayFn)(value, unit)

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        <button onClick={prevMetric} className="px-2 pointer-events-auto">
          {`<`}
        </button>
        <div className="text-xs mt-1">{label}</div>
        <button onClick={nextMetric} className="px-2 pointer-events-auto">
          {`>`}
        </button>
      </div>
      <div className="font-bold text-lg">{displayValue}</div>
    </div>
  )
}

export default MetricsCarousel
