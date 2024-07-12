"use client"
import {
  useAnalyseData,
  useHouses,
  useOrderListData,
  fetchAllBuildSystems,
} from "@opensystemslab/buildx-core"
import { useState } from "react"
import css from "./app.module.css"
import HousesPillsSelector2 from "./ui/HousePillsSelector2"
import ChassisCostChart from "./ui/ChassisCostChart"

const AnalyseIndex = () => {
  fetchAllBuildSystems()

  const { orderListRows } = useOrderListData()
  const analyseData = useAnalyseData()

  const houses = useHouses()

  console.log({ analyseData, orderListRows, houses })

  const [selectedHouseIds, setSelectedHouseIds] = useState<string[]>(
    houses.map((x) => x.houseId)
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex-grow-0">
        <HousesPillsSelector2
          {...{
            selectedHouseIds,
            onSelectedHouseIdsChange: setSelectedHouseIds,
          }}
        />
      </div>
      <div className="flex-auto">
        <div className={css.pageRoot}>
          <ChassisCostChart
            orderListRows={orderListRows}
            selectedHouseIds={selectedHouseIds}
          />
          {/* <FloorAreaChart analyseData={analyseData} /> */}
          {/* <CarbonEmissionsChart analyseData={analyseData} />  */}
        </div>
      </div>
    </div>
  )
}

export default AnalyseIndex
