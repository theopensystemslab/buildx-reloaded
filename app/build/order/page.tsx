"use client"

import { Download } from "@carbon/icons-react"
import { useMemo, useRef, useState } from "react"
import OrderListTable from "./OrderListTable"

const OrderIndexPage = () => {
  // const [csvDownloadUrl, setCsvDownloadUrl] = useState<string | null>(null)

  const csvUrl = useRef<string | null>(null)

  const downloadCsv = () => {
    const url = csvUrl.current
    if (url === null) return

    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "table-data.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div className="flex justify-between px-3 py-5">
        <div>
          <h1>Order list</h1>
          <p className="max-w-3xl mt-2">
            A list of all the WikiHouse blocks you will need to build your
            project. All prices are estimated. Send this list to a WikiHouse
            manufacturer to get a precise quote.
          </p>
        </div>
        <div>
          <button
            onClick={downloadCsv}
            className="flex font-semibold items-center"
          >
            <span>Download CSV</span>
            <span className="ml-2">
              <Download size={"20"} />
            </span>
          </button>
        </div>
      </div>
      <OrderListTable
        setCsvDownloadUrl={(s: string) => {
          csvUrl.current = s
        }}
      />
    </div>
  )
}

export default OrderIndexPage
