"use client"
import houses, { useHouseFloorAreas } from "@/hooks/houses"
import { A, capitalizeFirstLetters, R, S } from "@/utils/functions"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { trpc } from "../../../client/trpc"
import {
  useGetColorClass,
  useSelectedHouses,
} from "../../common/HousesPillsSelector"
import { formatWithUnit, useAnalyseData } from "../data"
import { useSystemsSettings } from "../../data/settings"
import ChartBar from "./ChartBar"
import css from "./charts.module.css"

const CarbonEmissionsChart = () => {
  const selectedHouses = useSelectedHouses()

  const getColorClass = useGetColorClass()

  // const houseFloorAreas = useHouseFloorAreas()

  // const totalFloorArea = pipe(
  //   houseFloorAreas,
  //   R.reduce(S.Ord)(0, (b, a) => b + a)
  // )

  const settings = useSystemsSettings()

  const analyseData = useAnalyseData()

  // const houseOperationalCo2 = Object.entries(dashboardData.byHouse).map(
  //   ([houseId, d]) => ({
  //     value: d.operationalCo2.annualTotal / 1000,
  //     color: dashboardData.colorsByHouseId[houseId],
  //   })
  // )
  return (
    <div className={clsx(css.chart)}>
      <div>
        <h2>Carbon emissions</h2>
        <h5>Estimated upfront</h5>
      </div>
      <div>
        <div className="grid grid-cols-4 gap-4 border-b border-black">
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
        <div className="grid grid-cols-4 gap-4">
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
      </div>
    </div>
  )
}

export default CarbonEmissionsChart
