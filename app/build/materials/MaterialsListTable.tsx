"use client"
import { ArrowDown } from "@carbon/icons-react"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { pipe } from "fp-ts/lib/function"
import { memo, useMemo } from "react"
import { A, capitalizeFirstLetters } from "~/utils/functions"
import { useSiteCurrency } from "../../design/state/siteCtx"
import PaginatedTable from "../PaginatedTable"
import { useMaterialsListRows } from "./useMaterialsListRows"

export type MaterialsListRow = {
  buildingName: string
  item: string
  category: string
  unit: string
  quantity: number
  specification: string
  costPerUnit: number
  cost: number
  embodiedCarbonPerUnit: number
  embodiedCarbonCost: number
  linkUrl?: string
}

type Props = {
  setCsvDownloadUrl: (s: string) => void
}
const MaterialsListTable = (props: Props) => {
  const { setCsvDownloadUrl } = props

  const materialsListRows = useMaterialsListRows()

  const { totalEstimatedCost, totalCarbonCost } = pipe(
    materialsListRows,
    A.reduce(
      { totalEstimatedCost: 0, totalCarbonCost: 0 },
      ({ totalEstimatedCost, totalCarbonCost }, row) => ({
        totalEstimatedCost: totalEstimatedCost + row.cost,
        totalCarbonCost: totalCarbonCost + row.embodiedCarbonCost,
      })
    )
  )

  const { formatWithSymbol } = useSiteCurrency()

  const columnHelper = createColumnHelper<MaterialsListRow>()

  const columns: ColumnDef<MaterialsListRow, any>[] = useMemo(
    () => [
      columnHelper.accessor("buildingName", {
        id: "Building Name",
        cell: (info) => {
          return <div>{capitalizeFirstLetters(info.getValue())}</div>
        },
        header: () => null,
      }),
      columnHelper.accessor("item", {
        cell: (info) => <span>{info.getValue()}</span>,
        header: () => <span>Item</span>,
      }),
      columnHelper.accessor("quantity", {
        cell: (info) => (
          <span>{`${Number(info.getValue()).toFixed(1)}m²`}</span>
        ),
        header: () => <span>Quantity</span>,
      }),
      columnHelper.accessor("specification", {
        cell: (info) => <span>{info.getValue()}</span>,
        header: () => <span>Specification</span>,
      }),
      columnHelper.accessor("costPerUnit", {
        cell: (info) => (
          <span>{`${formatWithSymbol(info.getValue())}/${
            info.row.original.unit
          }`}</span>
        ),
        header: () => <span>Estimated cost per unit</span>,
      }),
      columnHelper.accessor("cost", {
        cell: (info) => <span>{formatWithSymbol(info.getValue())}</span>,
        header: () => <span>Estimated cost</span>,
        footer: () => <span>{totalEstimatedCost}</span>,
      }),
      columnHelper.accessor("embodiedCarbonCost", {
        cell: (info) => (
          <span>{`${Number(info.getValue()).toFixed(1)}T CO₂`}</span>
        ),
        header: () => <span>Carbon cost</span>,
        footer: () => <span>{totalCarbonCost}</span>,
      }),
      columnHelper.accessor("linkUrl", {
        cell: (info) => (
          <a href={info.getValue()}>
            <div className="flex font-semibold items-center">
              <span>{`Go to website`}</span>
              <span>
                <ArrowDown size="20" className="ml-1 rotate-[135deg]" />
              </span>
            </div>
          </a>
        ),
        header: () => <span>Link</span>,
      }),
    ],
    [columnHelper, formatWithSymbol, totalCarbonCost, totalEstimatedCost]
  )

  return (
    <PaginatedTable
      data={materialsListRows}
      columns={columns}
      setCsvDownloadUrl={setCsvDownloadUrl}
    />
  )
}

export default memo(MaterialsListTable)
