"use client"
import { ArrowUp } from "@carbon/icons-react"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { pipe } from "fp-ts/lib/function"
import { memo, useEffect, useMemo } from "react"
import { A, capitalizeFirstLetters } from "~/utils/functions"
import PaginatedTable from "../PaginatedTable"
import { csvFormatRows } from "d3-dsv"
import {
  MaterialsListRow,
  useHouses,
  useMaterialsListRows,
  useProjectCurrency,
} from "@opensystemslab/buildx-core"
import { useSelectedHouseIds } from "~/analyse/ui/HousePillsSelector"
import { getColorClass } from "~/analyse/ui/colors"

type Props = {
  setCsvDownloadUrl: (s: string) => void
}

export const useMaterialsListDownload = (
  materialsListRows: MaterialsListRow[]
) =>
  useMemo(() => {
    if (materialsListRows.length > 0) {
      // Create a header row
      const headers = Object.keys(materialsListRows[0]).filter(
        (x) => !["houseId", "colorClass", "linkUrl"].includes(x)
      ) as Array<keyof (typeof materialsListRows)[0]>

      // Map each object to an array of its values
      const rows = materialsListRows.map((row) =>
        headers.map((header) => row[header]?.toString() ?? "")
      )

      // Combine header and rows
      const csvData = [headers, ...rows]

      // Format the 2D array into a CSV string
      const csvContent = csvFormatRows(csvData)

      // Create a Blob and URL for the CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      return { url: URL.createObjectURL(blob), blob }
    }
  }, [materialsListRows])

const MaterialsListTable = (props: Props) => {
  const { setCsvDownloadUrl } = props

  const selectedHouseIds = useSelectedHouseIds()

  const houses = useHouses()

  const allHouseIds = houses.map((x) => x.houseId)

  const materialsListRows = useMaterialsListRows(selectedHouseIds).map((x) => ({
    ...x,
    colorClass: getColorClass(allHouseIds, x.houseId),
  }))

  const materialsListDownload = useMaterialsListDownload(materialsListRows)

  useEffect(() => {
    if (materialsListDownload) {
      setCsvDownloadUrl(materialsListDownload.url)
    }
  }, [materialsListDownload, setCsvDownloadUrl])

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

  const { format } = useProjectCurrency()

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
      columnHelper.accessor("category", {
        id: "Category",
        cell: (info) => {
          return <div>{info.getValue()}</div>
        },
        header: () => <span>Category</span>,
      }),
      columnHelper.accessor("quantity", {
        cell: (info) => {
          const unit = info.row.original.unit
          const value = info.getValue()
          return <span>{unit ? `${value.toFixed(1)}${unit}` : value}</span>
        },
        header: () => <span>Quantity</span>,
      }),
      columnHelper.accessor("specification", {
        cell: (info) => <span>{info.getValue()}</span>,
        header: () => <span>Specification</span>,
      }),
      columnHelper.accessor("costPerUnit", {
        cell: (info) => {
          const unit = info.row.original.unit

          return (
            <span>
              {format(info.getValue())}
              {unit !== null ? `/${unit}` : null}
            </span>
          )
        },
        header: () => <span>Estimated cost per unit</span>,
      }),
      columnHelper.accessor("cost", {
        cell: (info) => <span>{format(info.getValue().toFixed(0))}</span>,
        header: () => <span>Estimated cost</span>,
        footer: () => <span>{format(totalEstimatedCost)}</span>,
      }),
      columnHelper.accessor("embodiedCarbonCost", {
        cell: (info) => (
          <span>{`${Number(info.getValue()).toFixed(0)} kgCO₂`}</span>
        ),
        header: () => <span>Carbon cost</span>,
        footer: () => (
          <span>
            {totalCarbonCost.toFixed(0)}
            {` T CO₂`}
          </span>
        ),
      }),
      columnHelper.accessor("linkUrl", {
        cell: (info) => {
          const value = info.getValue()
          return value ? (
            <a href={value}>
              <div className="flex font-semibold items-center">
                <span>{`Go to website`}</span>
                <span>
                  <ArrowUp size="20" className="ml-1 rotate-[45deg]" />
                </span>
              </div>
            </a>
          ) : null
        },
        header: () => <span>Link</span>,
      }),
    ],
    [columnHelper, format, totalCarbonCost, totalEstimatedCost]
  )

  return <PaginatedTable data={materialsListRows} columns={columns} />
}

export default memo(MaterialsListTable)
