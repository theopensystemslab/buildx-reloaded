"use client"

import MaterialsListTable from "./MaterialsListTable"

const MaterialsListIndexPage = () => {
  return (
    <div>
      <div className="px-3 py-5">
        <h1>Materials list</h1>

        <p className="max-w-3xl mt-2">
          A list of the other materials you will need to find and purchase from
          other manufacturers. All prices are estimated.
        </p>
      </div>
      <MaterialsListTable />
    </div>
  )
}

export default MaterialsListIndexPage
