import clsx from "clsx"
import React, { Fragment, useState } from "react"
import { useAnalyseData } from "../../../analyse/state/data"
import IconButton, { iconButtonStyles } from "../../../ui/IconButton"
import { Analyse, Close } from "../../../ui/icons"
import { useSiteCurrency } from "../../state/siteCtx"
import MetricsCarousel from "./MetricsCarousel"
import css from "./MetricsWidget.module.css"

const MetricsWidget = () => {
  const { costs, embodiedCo2 } = useAnalyseData()
  const { symbol } = useSiteCurrency()

  const [isOpen, setOpen] = useState(false)
  const toggleOpen = () => setOpen(!isOpen)

  return (
    <div className={css.root}>
      {!isOpen && (
        <IconButton
          onClick={toggleOpen}
          // className={clsx(iconButtonStyles, "bg-white hover:bg-white")}
        >
          <div className="flex items-center justify-center">
            <Analyse />
          </div>
        </IconButton>
      )}

      {isOpen && (
        <div className="relative">
          {/* <button
            className="absolute top-0 right-0 px-3 py-2 bg-red-200 rounded"
            onClick={toggleOpen}
          >
            {"X"}
          </button> */}

          <div className="absolute top-0 right-0 flex items-center mt-1 justify-end">
            <button className="w-8" onClick={toggleOpen}>
              <Close />
            </button>
            {/* <IconButton onClick={toggleOpen}>
              <Close />
            </IconButton> */}
          </div>
          <div className="pt-10 pb-6 pr-6">
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
        </div>
      )}
    </div>
  )
}

export default MetricsWidget
