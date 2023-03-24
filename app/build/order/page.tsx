"use client"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import clsx from "clsx"
import { buildingColorVariants } from "../../common/HousesPillsSelector"
import {
  BlockLineItem,
  useSelectedHouseBlockLineItems,
} from "./useSelectedHouseBlockLineItems"

const columnHelper = createColumnHelper<BlockLineItem>()

const OrderIndex = () => {
  const blockLineItems = useSelectedHouseBlockLineItems()

  const table = useReactTable({
    data: blockLineItems,
    columns: [
      columnHelper.accessor("buildingName", {
        cell: (info) => {
          return <span>{info.getValue()}</span>
        },
        header: () => <span>Building</span>,
      }),
      columnHelper.accessor("blockName", {
        cell: (info) => <span>{info.getValue()}</span>,
        header: () => <span>Block name</span>,
      }),
      columnHelper.accessor("sheetsPerBlock", {
        cell: (info) => <span>{info.getValue()}</span>,
        header: () => <span>Sheets per block</span>,
      }),
      columnHelper.accessor("count", {
        cell: (info) => <span>{info.getValue()}</span>,
        header: () => <span>{`No. of blocks`}</span>,
      }),
      columnHelper.accessor("totalPlywood", {
        cell: (info) => <span>{info.getValue()}</span>,
        header: () => <span>Total plywood</span>,
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <h1>Order list</h1>
      <p>
        A list of all the WikiHouse blocks you will need to build your project.
        All prices are estimated. Send this list to a WikiHouse manufacturer to
        get a precise quote.
      </p>
      {/* <OrderListTable blockLineItems={blockLineItems} /> */}
      {/* <div className="">
        {blockLineItems.map(({ houseId, block, count }) => (
          <div key={`${houseId}:${block?.id}`} className="flex">
            <div></div>
          </div>
        ))}
      </div> */}
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="text-left">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                return (
                  <td
                    key={cell.id}
                    className={clsx({
                      [row.original.colorClassName]:
                        cell.column.id === "buildingName",
                    })}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  )
}

export default OrderIndex
