import React, { Fragment, useState } from "react"
import { useAnalyseData } from "../../../analyse/state/data"
import { useSiteCurrency } from "../../state/siteCtx"
import MetricsCarousel from "./MetricsCarousel"
import css from "./MetricsWidget.module.css"

const MetricsWidget = () => {
  const { costs, embodiedCo2 } = useAnalyseData()
  const { symbol } = useSiteCurrency()

  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className={css.root}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute top-0 right-0 p-4 bg-gray-200 rounded"
      >
        {isVisible ? "X" : "Open"}
      </button>

      {isVisible && (
        <Fragment>
          <MetricsCarousel
            metrics={[
              {
                label: "Estimated build cost",
                value: costs.total,
                unit: symbol,
                displayFn: (unit, value) => unit + value.toFixed(2),
              },
            ]}
          />
          <MetricsCarousel
            metrics={[
              {
                label: "Estimated carbon cost",
                value: embodiedCo2.total / 1000,
                unit: "tCO₂e",
                displayFn: (unit, value) => `${value.toFixed(2)} ${unit}`,
              },
            ]}
          />
        </Fragment>
      )}
    </div>
  )
}

export default MetricsWidget
