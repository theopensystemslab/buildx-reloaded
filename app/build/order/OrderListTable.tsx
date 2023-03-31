"use client"
import { capitalizeFirstLetters } from "@/utils/functions"
import { ArrowDown } from "@carbon/icons-react"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import clsx from "clsx"
import PaginatedTable from "../PaginatedTable"
import { useOrderListData, OrderListRow } from "./useOrderListData"

const OrderListTable = () => {
  const {
    orderListData,
    totalMaterialCost,
    totalManufacturingCost,
    totalTotalCost,
    fmt,
  } = useOrderListData()

  const columnHelper = createColumnHelper<OrderListRow>()

  const columns: ColumnDef<OrderListRow, any>[] = [
    columnHelper.accessor("buildingName", {
      cell: (info) => {
        return (
          <div
            className={clsx("w-full h-full", {
              [info.row.original.colorClass]:
                info.cell.column.id === "buildingName",
            })}
          >
            {capitalizeFirstLetters(info.getValue())}
          </div>
        )
      },
      header: () => null,
    }),
    columnHelper.accessor("blockName", {
      cell: (info) => <span>{info.getValue()}</span>,
      header: () => <span>Block type</span>,
      footer: () => <span>Total</span>,
    }),
    columnHelper.accessor("count", {
      cell: (info) => <span>{info.getValue()}</span>,
      header: () => <span>Number</span>,
    }),
    columnHelper.accessor("costPerBlock", {
      cell: (info) => <span>{fmt(info.getValue())}</span>,
      header: () => <span>Cost per Block</span>,
    }),
    columnHelper.accessor("materialsCost", {
      cell: (info) => <span>{fmt(info.getValue())}</span>,
      header: () => <span>Material Cost</span>,
      footer: () => <span>{totalMaterialCost}</span>,
      // aggregatedCell: (info) => <span>{fmt(info.getValue())}</span>,
      // aggregationFn: "sum",
      // enableGrouping: true,
    }),
    columnHelper.accessor("manufacturingCost", {
      cell: (info) => <span>{fmt(info.getValue())}</span>,
      header: () => <span>Manufacturing Cost</span>,
      footer: () => <span>{totalManufacturingCost}</span>,
    }),
    columnHelper.accessor("cuttingFileUrl", {
      cell: (info) => (
        <a href={info.getValue()}>
          <div className="flex font-semibold items-center">
            <span>{`Download`}</span>
            <span>
              <ArrowDown size="20" className="ml-1" />
            </span>
          </div>
        </a>
      ),
      header: () => <span>Cutting File</span>,
    }),
    columnHelper.accessor("totalCost", {
      cell: (info) => <span>{fmt(info.getValue())}</span>,
      header: () => <span>Total cost</span>,
      footer: () => <span>{`${totalTotalCost} + VAT`}</span>,
    }),
  ]

  return <PaginatedTable data={orderListData} columns={columns} />
}

export default OrderListTable
