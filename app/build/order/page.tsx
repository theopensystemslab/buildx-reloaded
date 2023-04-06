"use client"

import OrderListTable from "./OrderListTable"

const OrderIndexPage = () => {
  return (
    <div>
      <div className="px-3 py-5">
        <h1>Order list</h1>
        <p className="max-w-3xl mt-2">
          A list of all the WikiHouse blocks you will need to build your
          project. All prices are estimated. Send this list to a WikiHouse
          manufacturer to get a precise quote.
        </p>
      </div>
      <OrderListTable />
    </div>
  )
}

export default OrderIndexPage
