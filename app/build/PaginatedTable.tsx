import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"
import clsx from "clsx"
import { csvFormatRows } from "d3-dsv"
import { pipe } from "fp-ts/lib/function"
import { useEffect } from "react"
import { A, O, R } from "~/utils/functions"
import css from "./PaginatedTable.module.css"

type Props<T extends {}> = {
  data: T[]
  columns: ColumnDef<T>[]
}

const PaginatedTable = <T extends {}>(props: Props<T>) => {
  const { data, columns } = props

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
  })

  // const {
  //   pagination: { pageIndex, pageSize },
  // } = table.getState()

  // const firstRow = pageIndex * pageSize + 1
  // const lastRow = Math.min((pageIndex + 1) * pageSize, data.length)

  // const itemCount = data.length

  useEffect(() => {
    const headers: string[] = columns.map((column) => column.id as string)

    // @ts-ignore
    const accessorKeys: string[] = columns.map((column) => column.accessorKey)

    const rows: string[][] = pipe(
      data,
      A.map((row) =>
        pipe(
          accessorKeys,
          A.filterMap((k) => pipe(row, R.lookup(k), O.map(String)))
        )
      )
    )

    const csvContent = csvFormatRows([headers, ...rows])

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
  }, [columns, data])

  return (
    <div className={css.root}>
      <table className={css.table}>
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
                  const className = clsx({
                    [(row.original as any).colorClass]:
                      // @ts-ignore
                      cell.column.columnDef.accessorKey === "buildingName" &&
                      "colorClass" in (row.original as any),
                    // [(row.original as any).categoryColorClass]:
                    //   // @ts-ignore
                    //   cell.column.columnDef.accessorKey === "category" &&
                    //   "categoryColorClass" in (row.original as any),
                  })

                  return (
                    <td key={cell.id} className={className}>
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
      {/* <div className={css.paginationControls}>
        <div className={css.pageSizeSelect}>
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
          <div>
            {firstRow}-{lastRow} of {itemCount} items
          </div>
        </div>
        <div className={css.pageSelector}>
          <select
            value={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              table.setPageIndex(Number(e.target.value) - 1)
            }}
          >
            {NEA.range(1, table.getPageCount()).map((pageNumber) => (
              <option key={pageNumber} value={pageNumber}>
                {pageNumber}
              </option>
            ))}
          </select>

          <span className="flex items-center justify-end gap-1 flex-grow">
            of {table.getPageCount()} pages
          </span>
        </div>
        <div className={css.carets}>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <CaretLeft />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <CaretRight />
          </button>
        </div>
      </div> */}
    </div>
  )
}

export default PaginatedTable
