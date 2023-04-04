import { Fragment } from "react"
import BuildCostChart from "./components/BuildCostChart"
import CarbonEmissionsChart from "./components/CarbonEmissionsChart"
import FloorAreaChart from "./components/FloorAreaChart"

const AnalyseIndex = () => {
  return (
    <Fragment>
      <div className="w-full h-full flex justify-start items-center space-x-5">
        <BuildCostChart />
        <FloorAreaChart />
        <CarbonEmissionsChart />
      </div>
    </Fragment>
  )
}

export default AnalyseIndex
