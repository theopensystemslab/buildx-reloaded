"use client"
import {
  OutputsWorker,
  fetchAllBuildSystems,
  useAnalysisData,
  useOrderListData,
} from "@opensystemslab/buildx-core"
import css from "./app.module.css"
import CarbonEmissionsChart from "./ui/CarbonEmissionsChart"
import ChassisCostChart from "./ui/ChassisCostChart"
import FloorAreaChart from "./ui/FloorAreaChart"
import HousesPillsSelector2, {
  useSelectedHouseIds,
} from "./ui/HousePillsSelector2"

new OutputsWorker()

const AnalyseIndex = () => {
  fetchAllBuildSystems()

  const { orderListRows } = useOrderListData()
  const analysisData = useAnalysisData()

  const selectedHouseIds = useSelectedHouseIds()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex-grow-0">
        <HousesPillsSelector2 />
      </div>
      <div className="flex-auto">
        <div className={css.pageRoot}>
          <ChassisCostChart
            selectedHouseIds={selectedHouseIds}
            orderListRows={orderListRows}
          />
          <FloorAreaChart
            selectedHouseIds={selectedHouseIds}
            analyseData={analysisData}
          />
          <CarbonEmissionsChart
            selectedHouseIds={selectedHouseIds}
            analyseData={analysisData}
          />
        </div>
      </div>
    </div>
  )
}

export default AnalyseIndex
