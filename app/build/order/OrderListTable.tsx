"use client"
import { A, capitalizeFirstLetters, R } from "@/utils/functions"
import { ArrowDown } from "@carbon/icons-react"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { csvFormat } from "d3-dsv"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useMemo } from "react"
import PaginatedTable from "../PaginatedTable"
import { OrderListRow, useOrderListData } from "./useOrderListData"

type Props = {
  setCsvDownloadUrl: (s: string) => void
}

const OrderListTable = (props: Props) => {
  const { setCsvDownloadUrl } = props

  const {
    orderListData,
    totalMaterialCost,
    totalManufacturingCost,
    totalTotalCost,
    fmt,
  } = useOrderListData()

  const columnHelper = createColumnHelper<OrderListRow>()

  const columns: ColumnDef<OrderListRow, any>[] = useMemo(
    () => [
      columnHelper.accessor("buildingName", {
        id: "Building Name",
        cell: (info) => {
          return <div>{capitalizeFirstLetters(info.getValue())}</div>
        },
        header: () => null,
      }),
      columnHelper.accessor("blockName", {
        id: "Block Name",
        cell: (info) => <span>{info.getValue()}</span>,
        header: () => <span>Block type</span>,
        footer: () => <span>Total</span>,
      }),
      columnHelper.accessor("count", {
        id: "Count",
        cell: (info) => <span>{info.getValue()}</span>,
        header: () => <span>Number</span>,
      }),
      columnHelper.accessor("costPerBlock", {
        id: "Cost Per Block",
        cell: (info) => <span>{fmt(info.getValue())}</span>,
        header: () => <span>Cost per Block</span>,
      }),
      columnHelper.accessor("materialsCost", {
        id: "Materials Cost",
        cell: (info) => <span>{fmt(info.getValue())}</span>,
        header: () => <span>Material Cost</span>,
        footer: () => <span>{totalMaterialCost}</span>,
      }),
      columnHelper.accessor("manufacturingCost", {
        id: "Manufacturing Cost",
        cell: (info) => <span>{fmt(info.getValue())}</span>,
        header: () => <span>Manufacturing Cost</span>,
        footer: () => <span>{totalManufacturingCost}</span>,
      }),
      columnHelper.accessor("cuttingFileUrl", {
        id: "Cutting File URL",
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
        id: "Total Cost",
        cell: (info) => <span>{fmt(info.getValue())}</span>,
        header: () => <span>Total cost</span>,
        footer: () => <span>{`${totalTotalCost} + VAT`}</span>,
      }),
    ],
    [
      columnHelper,
      fmt,
      totalManufacturingCost,
      totalMaterialCost,
      totalTotalCost,
    ]
  )

  useEffect(() => {
    const headers = columns.map((column) => column.id)

    // @ts-ignore
    const accessorKeys: string[] = columns.map((column) => column.accessorKey)

    const data = pipe(
      orderListData,
      A.map((row) =>
        pipe(
          accessorKeys,
          A.filterMap((k) => pipe(row, R.lookup(k)))
        )
      )
    )

    const csvContent = csvFormat([headers, ...data])
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    setCsvDownloadUrl(url)
  }, [columns, orderListData, setCsvDownloadUrl])

  return <PaginatedTable data={orderListData} columns={columns} />
}

export default OrderListTable
