"use client"
import {
  useAnalyseData,
  useHouses,
  useOrderListData,
  fetchAllBuildSystems,
  OutputsWorker,
} from "@opensystemslab/buildx-core"
import { useEffect, useState } from "react"
import css from "./app.module.css"
import HousesPillsSelector2 from "./ui/HousePillsSelector2"
import ChassisCostChart from "./ui/ChassisCostChart"
import FloorAreaChart from "./ui/FloorAreaChart"
import CarbonEmissionsChart from "./ui/CarbonEmissionsChart"

new OutputsWorker()

const AnalyseIndex = () => {
  fetchAllBuildSystems()

  const { orderListRows } = useOrderListData()
  const analyseData = useAnalyseData()

  const [selectedHouseIds, setSelectedHouseIds] = useState<string[]>([])

  const houses = useHouses()

  useEffect(() => {
    if (selectedHouseIds.length === 0) {
      setSelectedHouseIds(houses.map((x) => x.houseId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houses])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex-grow-0">
        <HousesPillsSelector2
          {...{
            selectedHouseIds, // console.log({ analyseData, orderListRows, houses })
            onSelectedHouseIdsChange: setSelectedHouseIds,
          }}
        />
      </div>
      <div className="flex-auto">
        <div className={css.pageRoot}>
          <ChassisCostChart
            selectedHouseIds={selectedHouseIds}
            orderListRows={orderListRows}
          />
          <FloorAreaChart
            selectedHouseIds={selectedHouseIds}
            analyseData={analyseData}
          />
          <CarbonEmissionsChart
            selectedHouseIds={selectedHouseIds}
            analyseData={analyseData}
          />
        </div>
      </div>
    </div>
  )
}

export default AnalyseIndex
