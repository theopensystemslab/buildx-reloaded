import React, { useState } from "react"

type Metric = {
  label: string
  value: number
  unit?: string
  displayFn?: (unit: string, value: number) => string
}

const CarouselSlide = ({ metric }: { metric: Metric }) => {
  const { label, value, unit = "", displayFn } = metric

  const defaultDisplayFn = (unit: string | undefined, value: number) => {
    return unit ? `${value} ${unit}` : `${value}`
  }

  const displayValue = (displayFn || defaultDisplayFn)(unit, value)

  return (
    <div className="p-4">
      <div className="text-xs">{label}</div>
      <div className="mt-1 font-bold text-lg">{displayValue}</div>
    </div>
  )
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

  return (
    <div className="flex items-center">
      <button onClick={prevMetric} className="p-2 pointer-events-auto">
        {`<`}
      </button>
      <CarouselSlide metric={metrics[currentIndex]} />
      <button onClick={nextMetric} className="p-2 pointer-events-auto">
        {`>`}
      </button>
    </div>
  )
}

export default MetricsCarousel
