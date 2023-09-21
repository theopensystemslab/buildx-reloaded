"use client"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { capitalizeFirstLetters, R, S } from "~/utils/functions"
import houses from "../../design/state/houses"
import { AnalyseData, formatWithUnit, useAnalyseData } from "../state/data"
import ChartBar from "./ChartBar"
import {
  ChartColumn,
  ChartContainer,
  ChartMetrics,
  ChartTitles,
  HowIsItCalculated,
  WhatIsThis,
} from "./chartComponents"
import { useGetColorClass } from "./HousesPillsSelector"

const CarbonEmissionsChart = ({
  analyseData,
}: {
  analyseData: AnalyseData
}) => {
  const getColorClass = useGetColorClass()

  const totalValue = analyseData.operationalCo2.annualTotal

  return (
    <ChartColumn>
      <ChartTitles title="Upfront carbon emissions" subtitle="Estimated net" />
      <ChartContainer>
        <div
          className={clsx(
            "grid grid-cols-3 border-black h-full",
            totalValue === 0
              ? "hidden"
              : totalValue > 0
              ? "border-b"
              : "border-t"
          )}
        >
          <div />

          {Object.keys(analyseData.byHouse).length > 0 && (
            <ChartBar
              items={pipe(
                analyseData.byHouse,
                R.collect(S.Ord)((houseId, { operationalCo2 }) => ({
                  houseId,
                  value: operationalCo2.annualTotal,
                  buildingName: houses[houseId].friendlyName,
                }))
              )}
              itemToColorClass={(item) => getColorClass(item.houseId)}
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
                  <div>{formatWithUnit(item.value, "T")}</div>
                </div>
              )}
              reverse
            />
          )}
          <div />
        </div>
      </ChartContainer>
      <ChartMetrics>
        <div className="text-5xl font-normal">{formatWithUnit(-85, "T")}</div>
        <div>Project will remove carbon dioxide from the atmosphere</div>
      </ChartMetrics>
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
        We use generic data from [database]. You can replace these values with a
        more specific, accurate estimate if you have one.
        `}
        </p>
      </HowIsItCalculated>
    </ChartColumn>
  )
}

export default CarbonEmissionsChart
