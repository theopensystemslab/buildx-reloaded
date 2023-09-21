"use client"
import { useLiveQuery } from "dexie-react-hooks"
import { Module } from "../../server/data/modules"
import { useOrderListData } from "../build/order/useOrderListData"
import systemsDB, { useAllModules } from "../db/systems"
import Loader from "../ui/Loader"
import css from "./page.module.css"
import { useAnalyseData } from "./state/data"
import CarbonEmissionsChart from "./ui/CarbonEmissionsChart"
import ChassisCostChart from "./ui/ChassisCostChart"
import FloorAreaChart from "./ui/FloorAreaChart"

const AnalyseIndex = () => {
  const { orderListRows } = useOrderListData()
  const analyseData = useAnalyseData()
  const modules = useAllModules()

  return (
    <div className={css.pageRoot}>
      <ChassisCostChart orderListRows={orderListRows} />
      <FloorAreaChart modules={modules} />
      <CarbonEmissionsChart analyseData={analyseData} />
    </div>
  )
}

export default AnalyseIndex
