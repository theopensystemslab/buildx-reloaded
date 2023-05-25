import { CaretLeft, CaretRight } from "@carbon/icons-react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
  setCsvDownloadUrl: (s: string) => void
}

const PaginatedTable = <T extends {}>(props: Props<T>) => {
  const { data, columns, setCsvDownloadUrl } = props

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const {
    pagination: { pageIndex, pageSize },
  } = table.getState()

  const firstRow = pageIndex * pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * pageSize, data.length)

  const itemCount = data.length

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

    setCsvDownloadUrl(url)
  }, [columns, data, setCsvDownloadUrl])

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
                  const className = clsx(
                    {
                      [(row.original as any).colorClass]:
                        // @ts-ignore
                        cell.column.columnDef.accessorKey === "buildingName" &&
                        "colorClass" in (row.original as any),
                    }
                    // "w-full h-full"
                  )

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
      {/* <div className="h-2" /> */}
      <div className={css.paginationControls}>
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
        <span className="flex items-center gap-1 flex-grow">
          {firstRow}-{lastRow} of {itemCount} items
        </span>
        <span className="flex items-center justify-end gap-1 flex-grow">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
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
        {/* <span className="flex items-center gap-1">
          Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="border p-1 rounded w-16"
          />
        </span> */}
      </div>
    </div>
  )
}

export default PaginatedTable
