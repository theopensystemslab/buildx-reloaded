"use client"
import { ArrowDown } from "@carbon/icons-react"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { memo, useMemo } from "react"
import { capitalizeFirstLetters } from "~/utils/functions"
import { OrderListRow, useGetColorClass, useOrderListData } from "../../db/user"
import PaginatedTable from "../PaginatedTable"

type Props = {
  setCsvDownloadUrl: (s: string) => void
}

const OrderListTable = (props: Props) => {
  const { setCsvDownloadUrl } = props

  const {
    orderListRows,
    totalMaterialCost,
    totalManufacturingCost,
    totalTotalCost,
    fmt,
  } = useOrderListData()

  const getColorClass = useGetColorClass()

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

  return (
    <PaginatedTable
      data={orderListRows.map((x) => ({
        ...x,
        colorClass: getColorClass(x.houseId),
      }))}
      columns={columns}
      setCsvDownloadUrl={setCsvDownloadUrl}
    />
  )
}

export default memo(OrderListTable)
