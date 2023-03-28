import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import clsx from "clsx"
import React from "react"
import { useSiteCurrency } from "../../../src/hooks/siteCtx"
import { capitalizeFirstLetters } from "../../../src/utils/functions"
import {
  BlockLineItem,
  useSelectedHouseBlockLineItems,
} from "./useSelectedHouseBlockLineItems"

const PaginatedTable = () => {
  const columnHelper = createColumnHelper<BlockLineItem>()

  const data = useSelectedHouseBlockLineItems()

  const { code: currencyCode, symbol: currencySymbol } = useSiteCurrency()

  const columns: ColumnDef<BlockLineItem, any>[] = [
    columnHelper.accessor("buildingName", {
      cell: (info) => {
        return <span>{capitalizeFirstLetters(info.getValue())}</span>
      },
      header: () => null,
    }),
    columnHelper.accessor("blockName", {
      cell: (info) => <span>{info.getValue()}</span>,
      header: () => <span>Block type</span>,
    }),
    columnHelper.accessor("count", {
      cell: (info) => <span>{info.getValue()}</span>,
      header: () => <span>Number</span>,
    }),
    columnHelper.accessor("costPerBlock", {
      cell: (info) => (
        <span>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyCode,
          }).format(info.getValue())}
        </span>
      ),
      header: () => <span>Cost per Block</span>,
    }),
    columnHelper.accessor("materialsCost", {
      cell: (info) => <span>{info.getValue()}</span>,
      header: () => <span>Material Cost</span>,
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    // Pipeline
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    //
    debugTable: true,
  })

  const {
    pagination: { pageIndex, pageSize },
  } = table.getState()

  const firstRow = pageIndex * pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * pageSize, data.length)

  const itemCount = data.length

  return (
    <div className="p-2 ">
      <div className="h-2" />
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {/* {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null} */}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="h-2" />
      <div className="flex justify-between gap-2">
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 25, 50, 100].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
        {/* <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button> */}

        <span className="flex items-center gap-1 flex-grow">
          {firstRow}-{lastRow} of {itemCount} items
          {/* {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          - {table.getState().pagination.pageSize} of{" "}
          {table.getRowModel().rows.length} */}
        </span>
        <span className="flex items-center justify-end gap-1 flex-grow">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <div>
          <button
            className="border rounded p-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
        </div>
        {/* <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button> */}
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="border p-1 rounded w-16"
          />
        </span>
      </div>
      <div>{table.getRowModel().rows.length} Rows</div>
      <pre>{JSON.stringify(table.getState().pagination, null, 2)}</pre>
    </div>
  )
}

export default PaginatedTable
