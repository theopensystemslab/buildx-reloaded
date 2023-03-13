"use client"
import { Fragment } from "react"
import HousesView from "./HousesView"

const BuildIndex = () => {
  return (
    <Fragment>
      {/* <HousePillsSelect />
      <BuildPageSubNav /> */}
      <div className="w-full h-full flex justify-center items-center">
        <HousesView />
      </div>
    </Fragment>
  )
}

export default BuildIndex
