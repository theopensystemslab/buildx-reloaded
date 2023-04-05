"use client"
import { useHouseFloorAreas } from "@/hooks/houses"
import { A, capitalizeFirstLetters, R, S } from "@/utils/functions"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import {
  useGetColorClass,
  useSelectedHouses,
} from "../../common/HousesPillsSelector"
import ChartBar from "./ChartBar"
import css from "./charts.module.css"

const FloorAreaChart = () => {
  const selectedHouses = useSelectedHouses()

  const getColorClass = useGetColorClass()

  const houseFloorAreas = useHouseFloorAreas()

  const totalFloorArea = pipe(
    houseFloorAreas,
    R.reduce(S.Ord)(0, (b, a) => b + a)
  )

  return (
    <div className={clsx(css.chart)}>
      <div>
        <h2>Floor area</h2>
        <h5>Gross internal m²</h5>
      </div>
      <div>
        {selectedHouses.length > 0 && (
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
                  colorClass: getColorClass(houseId),
                  displayName: capitalizeFirstLetters(house.friendlyName),
                }
              })
            )}
            itemToColorClass={(item) => item.colorClass}
            itemToValue={(item) => item.floorArea}
            itemToKey={(item) => item.houseId}
            renderItem={(item) => (
              <div className="flex flex-col justify-center  items-center px-2">
                <div>{item.displayName}</div>
                <div>{item.floorArea}</div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  )
}

export default FloorAreaChart
