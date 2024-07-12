"use client"
import {
  AnalysisData,
  useHouses,
  useProjectCurrency,
} from "@opensystemslab/buildx-core"
import { pipe } from "fp-ts/lib/function"
import { A, capitalizeFirstLetters, O, R } from "~/utils/functions"
import ChartBar from "./ChartBar"
import {
  ChartColumn,
  ChartContainer,
  ChartMetrics,
  ChartTitles,
  HowIsItCalculated,
  WhatIsThis,
} from "./chartComponents"
import { getColorClass } from "./colors"
import { formatWithUnit } from "@opensystemslab/buildx-core"

const FloorAreaChart = ({
  analyseData,
  selectedHouseIds,
}: {
  analyseData: AnalysisData
  selectedHouseIds: string[]
}) => {
  const selectedHouses = useHouses().filter(({ houseId }) =>
    selectedHouseIds.includes(houseId)
  )

  const { format } = useProjectCurrency()

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
                          colorClass: getColorClass(selectedHouseIds, houseId),
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
                <div>
                  {formatWithUnit(Number(item.floorArea.toFixed(1)), "m²")}
                </div>
              </div>
            )}
          />
        </div>
      </ChartContainer>
      <ChartMetrics>
        <div className="flex">
          <div className="text-5xl font-normal">
            {formatWithUnit(Number(areas.totalFloor.toFixed(1)), "m²")}
          </div>
        </div>
        <div>
          <div>
            <span className="text-3xl">{`${format(
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
