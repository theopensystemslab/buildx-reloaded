import React from "react"
import { useAnalyseData } from "../../../analyse/state/data"
import { useSiteCurrency } from "../../state/siteCtx"
import MetricsCarousel from "./MetricsCarousel"
import css from "./MetricsWidget.module.css"

const MetricsWidget = () => {
  const { costs, embodiedCo2 } = useAnalyseData()
  const { symbol } = useSiteCurrency()

  return (
    <div className={css.root}>
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
    </div>
  )
}

export default MetricsWidget
