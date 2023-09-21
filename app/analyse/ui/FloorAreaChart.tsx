"use client"
import { pipe } from "fp-ts/lib/function"
import { A, capitalizeFirstLetters, O, R, S } from "~/utils/functions"
import { floor } from "~/utils/math"
import { Module } from "../../../server/data/modules"
import { housesToRecord } from "../../db/user"
import { useSiteCurrency } from "../../design/state/siteCtx"
import { formatWithUnit, useAnalyseData } from "../state/data"
import ChartBar from "./ChartBar"
import {
  ChartColumn,
  ChartContainer,
  ChartMetrics,
  ChartTitles,
  HowIsItCalculated,
  WhatIsThis,
} from "./chartComponents"
import { useGetColorClass, useSelectedHouses } from "./HousesPillsSelector"

const FloorAreaChart = ({ modules }: { modules: Module[] }) => {
  const selectedHouses = useSelectedHouses()

  const getColorClass = useGetColorClass()

  const houseFloorAreas = pipe(
    selectedHouses,
    housesToRecord,
    R.map((house) =>
      pipe(
        house.dnas,
        A.map((dna) =>
          pipe(
            modules,
            A.findFirst((x) => x.dna === dna)
          )
        ),
        A.sequence(O.Applicative),
        O.map(A.reduce(0, (b, a) => b + a.floorArea)),
        O.getOrElse(() => 0)
      )
    )
  )

  const totalFloorArea = pipe(
    houseFloorAreas,
    R.reduce(S.Ord)(0, (b, a) => b + a)
  )

  const { formatWithSymbol } = useSiteCurrency()

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
            {formatWithUnit(floor(totalFloorArea), "m²")}
          </div>
        </div>
        <div>
          <div>
            <span className="text-3xl">{`${formatWithSymbol(0)}/m²`}</span>
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
