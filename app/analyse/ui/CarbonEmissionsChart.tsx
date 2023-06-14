"use client"
import { capitalizeFirstLetters, R, S } from "~/utils/functions"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { useGetColorClass } from "./HousesPillsSelector"
import { formatWithUnit, useAnalyseData } from "../state/data"
import ChartBar from "./ChartBar"
import css from "./charts.module.css"
import houses from "../../design/state/houses"

const CarbonEmissionsChart = () => {
  const getColorClass = useGetColorClass()

  const analyseData = useAnalyseData()

  return (
    <div className={clsx(css.chart)}>
      <div>
        <h2>Upfront carbon emissions</h2>
        <h5>Estimated net</h5>
      </div>

      <div className="grid grid-cols-3 h-32 border-t border-black">
        <div />
        <ChartBar
          items={pipe(
            analyseData.byHouse,
            R.collect(S.Ord)((houseId, { operationalCo2 }) => ({
              houseId,
              value: operationalCo2.annualTotal / 1000,
              buildingName: houses[houseId].friendlyName,
            }))
          )}
          itemToColorClass={(item) => getColorClass(item.houseId)}
          itemToValue={(item) => item.value}
          itemToKey={(item) => item.houseId}
          renderItem={(item) => (
            <div className="flex flex-col justify-center  items-center px-2">
              <div>{capitalizeFirstLetters(item.buildingName)}</div>
              <div>{formatWithUnit(item.value, "t")}</div>
            </div>
          )}
          reverse
        />
        <div />
      </div>

      <div className={css.chartBottom}>
        <div className="text-5xl font-normal">{formatWithUnit(-85, "T")}</div>
        <div>Project will remove carbon dioxide from the atmosphere</div>
      </div>
    </div>
  )
}

export default CarbonEmissionsChart
