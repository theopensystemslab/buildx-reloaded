"use client"
import dynamic from "next/dynamic"
import { PropsWithChildren } from "react"
import { TrpcProvider } from "../ui/TrpcProvider"
import {
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

const BuildLayout = ({ children }: PropsWithChildren<{}>) => {
  initSystemsWorker()
  initModelsWorker()
  initLayoutsWorker()

  return (
    <TrpcProvider>
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
    </TrpcProvider>
  )
}

export default BuildLayout
