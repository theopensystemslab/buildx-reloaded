"use client"
import dynamic from "next/dynamic"
import { Fragment } from "react"
// import HousesView from "./HousesView"

const HousesView = dynamic(() => import("./HousesView"), { ssr: false })

const OverviewIndex = () => {
  return (
    <Fragment>
      <div className="w-full h-full">
        <div className="relative w-full h-3/4">
          <HousesView />
        </div>
      </div>
    </Fragment>
  )
}

export default OverviewIndex
