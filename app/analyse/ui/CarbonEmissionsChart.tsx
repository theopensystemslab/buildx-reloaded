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
        <h2>Carbon emissions</h2>
        <h5>Estimated upfront</h5>
      </div>
      <div className="grid grid-cols-4 gap-4 border-b border-black h-32 [&>*]:h-full">
        <div />
        <div />
        <ChartBar
          className="text-white"
          items={pipe(
            analyseData.byHouse,
            R.collect(S.Ord)((houseId, { operationalCo2 }) => ({
              houseId,
              value: operationalCo2.annualTotal / 1000,
              buildingName: houses[houseId].friendlyName,
            }))
          )}
          itemToColorClass={(item) =>
            getColorClass(item.houseId, { stale: true })
          }
          itemToValue={(item) => item.value}
          itemToKey={(item) => item.houseId}
          renderItem={(item) => (
            <div className="flex flex-col justify-center  items-center px-2">
              <div>{capitalizeFirstLetters(item.buildingName)}</div>
              <div>{formatWithUnit(item.value, "t")}</div>
            </div>
          )}
        />
        <div />
      </div>
      <div className="grid grid-cols-4 gap-4 h-32">
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
