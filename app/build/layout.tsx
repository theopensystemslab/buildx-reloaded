"use client"
import dynamic from "next/dynamic"
import { PropsWithChildren } from "react"
import { useAllHouseTypes } from "../db/systems"
import { useIndexedSiteCtx } from "../design/state/siteCtx"
import Loader from "../ui/Loader"
import {
  initExportersWorker,
  initLayoutsWorker,
  initModelsWorker,
  initSystemsWorker,
} from "../workers"
import BuildNav from "./common/BuildNav"

const HousesPillsSelector = dynamic(
  () => import("../analyse/ui/HousesPillsSelector"),
  {
    ssr: false,
  }
)

const BuildLayoutMain = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="flex-auto overflow-y-auto flex flex-col">
      <div className="flex-1 flex-grow-0">
        <HousesPillsSelector />
      </div>
      <div className="flex flex-auto h-full overflow-y-auto">
        <div className="flex-1 flex-grow-0 flex-shrink-0 h-full">
          <BuildNav />
        </div>
        <div className="flex-auto border-l border-grey-20">{children}</div>
      </div>
    </div>
  )
}

const BuildLayout = ({ children }: PropsWithChildren<{}>) => {
  initSystemsWorker()
  initModelsWorker()
  initLayoutsWorker()
  initExportersWorker()

  useIndexedSiteCtx()

  const houseTypes = useAllHouseTypes()

  return houseTypes.length > 0 ? (
    <BuildLayoutMain>{children}</BuildLayoutMain>
  ) : (
    <Loader />
  )
}

export default BuildLayout
