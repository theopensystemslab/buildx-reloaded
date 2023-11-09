"use client"
import { pipe } from "fp-ts/lib/function"
import { A, capitalizeFirstLetters, O, R } from "~/utils/functions"
import { floor } from "~/utils/math"
import { useGetColorClass } from "../../db/user"
import { useSiteCurrency } from "../../db/user/siteCtx"
import { AnalyseData, formatWithUnit } from "../state/data"
import ChartBar from "./ChartBar"
import {
  ChartColumn,
  ChartContainer,
  ChartMetrics,
  ChartTitles,
  HowIsItCalculated,
  WhatIsThis,
} from "./chartComponents"
import { useSelectedHouses } from "./HousesPillsSelector"

const FloorAreaChart = ({ analyseData }: { analyseData: AnalyseData }) => {
  const selectedHouses = useSelectedHouses()

  const getColorClass = useGetColorClass()

  const { formatWithSymbol } = useSiteCurrency()

  const { areas, costs } = analyseData

  const houseFloorAreas = pipe(
    analyseData.byHouse,

    R.map((x) => pipe(x.areas.totalFloor))
  )

  return (
    <ChartColumn>
      <ChartTitles title="Floor area" subtitle="Gross internal m²" />
      <ChartContainer>
        <div className="grid grid-cols-1 h-full">
          <ChartBar
            className="h-full"
            items={pipe(
              houseFloorAreas,
              R.toArray,
              A.map(([houseId, floorArea]) =>
                pipe(
                  selectedHouses,
                  A.filterMap((selectedHouse) =>
                    selectedHouse.houseId === houseId
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
        </div>
      </ChartContainer>
      <ChartMetrics>
        <div className="flex">
          <div className="text-5xl font-normal">
            {formatWithUnit(floor(areas.totalFloor), "m²")}
          </div>
        </div>
        <div>
          <div>
            <span className="text-3xl">{`${formatWithSymbol(
              costs.total / areas.totalFloor
            )}/m²`}</span>
          </div>
          <div className="mt-4">
            <span>Estimated per floor area</span>
          </div>
        </div>
      </ChartMetrics>
      <WhatIsThis>
        <p>This is the internal floor area of your project.</p>
      </WhatIsThis>
      <HowIsItCalculated>
        <p>
          {`
          This is what is known as the 'gross internal floor area'. It is the
          entire floor area within the building. This includes internal walls
          and voids.
`}
        </p>
      </HowIsItCalculated>
    </ChartColumn>
  )
}

export default FloorAreaChart
