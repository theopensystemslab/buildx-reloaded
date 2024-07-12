"use client"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { capitalizeFirstLetters, R, S } from "~/utils/functions"
import ChartBar from "./ChartBar"
import {
  ChartColumn,
  ChartContainer,
  ChartMetrics2,
  ChartTitles,
  HowIsItCalculated,
  WhatIsThis,
} from "./chartComponents"
import {
  useHouses,
  housesToRecord,
  AnalysisData,
} from "@opensystemslab/buildx-core"
import { getColorClass } from "./colors"

const CarbonEmissionsChart = ({
  selectedHouseIds,
  analysisData,
}: {
  selectedHouseIds: string[]
  analysisData: AnalysisData
}) => {
  const houses = housesToRecord(useHouses())

  return (
    <ChartColumn>
      <ChartTitles title="Upfront carbon emissions" subtitle="Estimated net" />
      <ChartContainer>
        <div
          className={clsx(
            "grid grid-cols-3 border-black h-full",
            analysisData.embodiedCo2.total === 0
              ? "hidden"
              : analysisData.embodiedCo2.total > 0
              ? "border-b"
              : "border-t"
          )}
        >
          <div />

          {Object.keys(analysisData.byHouse).length > 0 && (
            <ChartBar
              items={pipe(
                analysisData.byHouse,
                R.collect(S.Ord)((houseId, { embodiedCo2 }) => ({
                  houseId,
                  value: embodiedCo2.total,
                  buildingName: houses[houseId].friendlyName,
                }))
              )}
              itemToColorClass={(item) =>
                getColorClass(selectedHouseIds, item.houseId)
              }
              itemToValue={(item) => item.value}
              itemToKey={(item) => item.houseId}
              // renderItem={(item) => (
              //   <div className="flex flex-col justify-center  items-center">
              //     <div>{capitalizeFirstLetters(item.buildingName)}</div>
              //     {/* <div>{formatCurrencyWithK(item.totalCost)}</div> */}
              //   </div>
              // )}
              renderItem={(item) => (
                <div className="flex flex-col justify-center items-center flex-shrink">
                  <div>{capitalizeFirstLetters(item.buildingName)}</div>
                  <div>{`${(item.value / 1000).toFixed(2)}t`}</div>
                </div>
              )}
              reverse
            />
          )}
          <div />
        </div>
      </ChartContainer>
      <ChartMetrics2>
        <div className="text-5xl font-normal">
          {`${(analysisData.embodiedCo2.total / 1000).toFixed(2)} tCO₂e`}
        </div>
        <div>Project will remove carbon dioxide from the atmosphere</div>
      </ChartMetrics2>
      <WhatIsThis>
        <p>
          {`
        This is an estimate of the net amount of carbon that will be emitted in
        the production of your project. This includes both the emissions from
        manufacturing and transportation, but also the carbon stored in
        bio-based materials, such as wood. 
        `}
        </p>
        <p>
          {`
Any stored carbon will be released if
        that material is burned or decomposed at the end of the building's
        life. Ideally WikiHouse blocks should be re-used or, ultimately, buried
        in landfill.
`}
        </p>
      </WhatIsThis>
      <HowIsItCalculated>
        <p>
          {`
We use generic embodied carbon data of lifecycle stages A1-A3 from product EPDs and the Inventory of Carbon & Energy (ICE) database. You can replace these values with a more specific, accurate estimate if you have one.
        `}
        </p>
      </HowIsItCalculated>
    </ChartColumn>
  )
}

export default CarbonEmissionsChart
