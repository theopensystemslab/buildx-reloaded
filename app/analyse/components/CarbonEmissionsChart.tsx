"use client"
import { useHouseFloorAreas } from "@/hooks/houses"
import { A, capitalizeFirstLetters, R, S } from "@/utils/functions"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { trpc } from "../../../client/trpc"
import {
  buildingColorVariants,
  useSelectedHouses,
} from "../../common/HousesPillsSelector"
import { useDataMetrics } from "../../data/metrics"
import { useSystemsSettings } from "../../data/settings"
import ChartBar from "./ChartBar"
import css from "./charts.module.css"

const CarbonEmissionsChart = () => {
  const selectedHouses = useSelectedHouses()

  // const houseFloorAreas = useHouseFloorAreas()

  // const totalFloorArea = pipe(
  //   houseFloorAreas,
  //   R.reduce(S.Ord)(0, (b, a) => b + a)
  // )

  const settings = useSystemsSettings()

  const foo = useDataMetrics()

  console.log({ settings, ...foo })

  return (
    <div className={clsx(css.chart)}>
      <div>
        <h2>Carbon emissions</h2>
        <h5>Gross internal m²</h5>
      </div>
      <pre>{JSON.stringify({ ...foo, settings }, null, 2)}</pre>
      <div>
        {/* {selectedHouses.length > 0 && (
          <ChartBar
            items={pipe(
              houseFloorAreas,
              R.toArray,
              A.map(([houseId, floorArea]) => {
                const houseIndex = selectedHouses.findIndex(
                  (x) => x.id === houseId
                )

                const house = selectedHouses[houseIndex]

                return {
                  houseId,
                  floorArea,
                  colorClass:
                    buildingColorVariants[
                      houseIndex % Object.keys(buildingColorVariants).length
                    ],
                  displayName: capitalizeFirstLetters(house.friendlyName),
                }
              })
            )}
            itemToColorClass={(item) => item.colorClass}
            itemToValue={(item) => item.floorArea}
            itemToKey={(item) => item.houseId}
            renderItem={(item) => (
              <div className="flex flex-col justify-center  items-center px-2">
                <div>{capitalizeFirstLetters(item.displayName)}</div>
                <div>{item.floorArea}</div>
              </div>
            )}
          />
        )} */}
      </div>
    </div>
  )
}

export default CarbonEmissionsChart
