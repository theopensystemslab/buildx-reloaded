"use client"

import OrderListTable from "./OrderListTable"

const OrderIndexPage = () => {
  return (
    <div>
      <h1>Order list</h1>
      <p>
        A list of all the WikiHouse blocks you will need to build your project.
        All prices are estimated. Send this list to a WikiHouse manufacturer to
        get a precise quote.
      </p>
      <OrderListTable />
    </div>
  )
}

export default OrderIndexPage
