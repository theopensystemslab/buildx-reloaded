"use client"
import { useHouseFloorAreas } from "@/hooks/houses"
import { A, capitalizeFirstLetters, R, S } from "@/utils/functions"
import { ArrowUp } from "@carbon/icons-react"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { useSiteCurrency } from "../../../src/hooks/siteCtx"
import { floor } from "../../../src/utils/math"
import {
  useGetColorClass,
  useSelectedHouses,
} from "../../common/HousesPillsSelector"
import { formatWithUnit } from "../data"
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

  const { formatWithSymbol } = useSiteCurrency()

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
                <div>{formatWithUnit(floor(item.floorArea), "m²")}</div>
              </div>
            )}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-0">
        <div className="flex justify-end mx-8 mt-2">
          <div className="text-5xl font-normal">
            {formatWithUnit(floor(totalFloorArea), "m²")}
          </div>
        </div>
        <div>
          <div>
            <span className="text-3xl">{`${formatWithSymbol(1200)}/m²`}</span>
          </div>
          <div className="pr-4">
            <span>Cost per floor area</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FloorAreaChart
