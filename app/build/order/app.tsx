"use client"
import { Download } from "@carbon/icons-react"
import { useEffect, useState } from "react"
import OrderListTable from "./OrderListTable"

const OrderIndexPage = () => {
  const [csvDownloadUrl, setCsvDownloadUrl] = useState<string | null>(null)

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
          {csvDownloadUrl !== null && (
            <a
              href={csvDownloadUrl}
              download={`order-list.csv`}
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
      <OrderListTable setCsvDownloadUrl={setCsvDownloadUrl} />
    </div>
  )
}

export default OrderIndexPage
