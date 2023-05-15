"use client"
import { A, capitalizeFirstLetters, O, R, S } from "@/utils/functions"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { useSiteCurrency } from "../../design/state/siteCtx"
import { floor } from "../../../src/utils/math"
import { useGetColorClass, useSelectedHouses } from "./HousesPillsSelector"
import { formatWithUnit, useHouseFloorAreas } from "../state/data"
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
      <div className="h-64">
        {selectedHouses.length > 0 && (
          <ChartBar
            className="h-full"
            items={pipe(
              houseFloorAreas,
              R.toArray,
              A.map(([houseId, floorArea]) =>
                pipe(
                  selectedHouses,
                  A.filterMap((selectedHouse) =>
                    selectedHouse.id === houseId
                      ? O.some({
                          houseId,
                          floorArea,
                          colorClass: getColorClass(houseId),
                          displayName: capitalizeFirstLetters(
                            selectedHouse.friendlyName
                          ),
                        })
                      : O.none
                  )
                )
              ),
              A.flatten
            )}
            itemToColorClass={(item) => item.colorClass}
            itemToValue={(item) => item.floorArea}
            itemToKey={(item) => item.houseId}
            renderItem={(item) => (
              <div className="flex flex-col justify-center  items-center">
                <div>{item.displayName}</div>
                <div>{formatWithUnit(floor(item.floorArea), "m²")}</div>
              </div>
            )}
          />
        )}
      </div>
      <div className={css.chartBottom}>
        <div className="flex justify-end mx-8 mt-2">
          <div className="text-5xl font-normal">
            {formatWithUnit(floor(totalFloorArea), "m²")}
          </div>
        </div>
        <div>
          <div>
            <span className="text-3xl">{`${formatWithSymbol(1200)}/m²`}</span>
          </div>
          <div className="">
            <span>Cost per floor area</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FloorAreaChart
