import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import React, { useReducer, useState } from "react"
import { Block } from "~/server/data/blocks"
import { Module } from "~/server/data/modules"

// const columnHelper = createColumnHelper<BlockLineItem>()

// const columns = [
//   columnHelper.accessor("houseId", {
//     cell: (info) => info.getValue(),
//     footer: (info) => info.column.id,
//   }),
//   columnHelper.accessor((row) => row.lastName, {
//     id: "lastName",
//     cell: (info) => <i>{info.getValue()}</i>,
//     header: () => <span>Last Name</span>,
//     footer: (info) => info.column.id,
//   }),
//   columnHelper.accessor("age", {
//     header: () => "Age",
//     cell: (info) => info.renderValue(),
//     footer: (info) => info.column.id,
//   }),
//   columnHelper.accessor("visits", {
//     header: () => <span>Visits</span>,
//     footer: (info) => info.column.id,
//   }),
//   columnHelper.accessor("status", {
//     header: "Status",
//     footer: (info) => info.column.id,
//   }),
//   columnHelper.accessor("progress", {
//     header: "Profile Progress",
//     footer: (info) => info.column.id,
//   }),
// ]

type Props = {
  blockLineItems: Array<{
    houseId: string
    block: Block
    module: Module
  }>
}

const OrderListTable = (props: Props) => {
  // const [data, setData] = useState(() => [...defaultData])
  // const rerender = useReducer(() => ({}), {})[1]

  // const table = useReactTable({
  //   data,
  //   columns,
  //   getCoreRowModel: getCoreRowModel(),
  // })

  // return (
  //   <div className="p-2">
  //     <table>
  //       <thead>
  //         {table.getHeaderGroups().map((headerGroup) => (
  //           <tr key={headerGroup.id}>
  //             {headerGroup.headers.map((header) => (
  //               <th key={header.id}>
  //                 {header.isPlaceholder
  //                   ? null
  //                   : flexRender(
  //                       header.column.columnDef.header,
  //                       header.getContext()
  //                     )}
  //               </th>
  //             ))}
  //           </tr>
  //         ))}
  //       </thead>
  //       <tbody>
  //         {table.getRowModel().rows.map((row) => (
  //           <tr key={row.id}>
  //             {row.getVisibleCells().map((cell) => (
  //               <td key={cell.id}>
  //                 {flexRender(cell.column.columnDef.cell, cell.getContext())}
  //               </td>
  //             ))}
  //           </tr>
  //         ))}
  //       </tbody>
  //       <tfoot>
  //         {table.getFooterGroups().map((footerGroup) => (
  //           <tr key={footerGroup.id}>
  //             {footerGroup.headers.map((header) => (
  //               <th key={header.id}>
  //                 {header.isPlaceholder
  //                   ? null
  //                   : flexRender(
  //                       header.column.columnDef.footer,
  //                       header.getContext()
  //                     )}
  //               </th>
  //             ))}
  //           </tr>
  //         ))}
  //       </tfoot>
  //     </table>
  //   </div>
  // )

  return null
}

export default OrderListTable
