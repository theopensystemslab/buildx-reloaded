"use client"
import { Fragment } from "react"
import HousesView from "./HousesView"

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
