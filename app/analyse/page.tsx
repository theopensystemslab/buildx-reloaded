import React, { Fragment } from "react"
import Chart from "./Chart"

const AnalyseIndex = () => {
  return (
    <Fragment>
      <div className="w-full h-full flex justify-center items-center pt-32">
        <h1>Analyse Index</h1>
        <Chart title="Floor Area" blueValue={5} greenValue={6} />
      </div>
    </Fragment>
  )
}

export default AnalyseIndex
