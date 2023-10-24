"use client"
import { Download } from "@carbon/icons-react"
import dynamic from "next/dynamic"
import { useState } from "react"

const MaterialsListTable = dynamic(() => import("./MaterialsListTable"), {
  ssr: false,
})

const MaterialsListIndexPage = () => {
  const [csvDownloadUrl, setCsvDownloadUrl] = useState<string | null>(null)

  return (
    <div>
      <div className="flex justify-between px-3 py-5">
        <div>
          <h1>Materials list</h1>
          <p className="max-w-3xl mt-2">
            A list of the other materials you will need to find and purchase
            from other manufacturers. All prices are estimated.
          </p>
        </div>
        <div>
          {csvDownloadUrl !== null && (
            <a
              href={csvDownloadUrl}
              download={`materials-list.csv`}
              className="flex font-semibold items-center"
            >
              <span>Download CSV</span>
              <span className="ml-2">
                <Download size={"20"} />
              </span>
            </a>
          )}
        </div>
      </div>
      <MaterialsListTable setCsvDownloadUrl={setCsvDownloadUrl} />
    </div>
  )
}

export default MaterialsListIndexPage
