"use client"
import { useSiteCurrency } from "@/hooks/siteCtx"
import { ArrowDown } from "@carbon/icons-react"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { pipe } from "fp-ts/lib/function"
import { memo, useMemo } from "react"
import { useGetElementMaterialName } from "../../../src/hooks/hashedMaterials"
import { A, capitalizeFirstLetters, R } from "../../../src/utils/functions"
import { useAnalyseData } from "../../analyse/data"
import {
  useSelectedHouseIds,
  useSelectedHouses,
} from "../../common/HousesPillsSelector"
import PaginatedTable from "../PaginatedTable"
import { useMaterialsListData } from "./useMaterialsListData"

type MaterialsListItem = {
  buildingName: string
  item: string
  quantity: number
  specification: string
  estimatedCostPerUnit: number
  estimatedCost: number
  carbonCost: number
  linkUrl: string
}

type Props = {
  setCsvDownloadUrl: (s: string) => void
}
const MaterialsListTable = (props: Props) => {
  const { setCsvDownloadUrl } = props

  // const selectedHouseIds = useSelectedHouseIds()

  // const { areas, costs, embodiedCo2, energyUse, operationalCo2, byHouse } =
  //   useAnalyseData()

  // const getElementMaterialName = useGetElementMaterialName()

  const { data, fmt } = useMaterialsListData()

  // const data: MaterialsListItem[] = useMemo(() => {
  //   const foo = pipe(
  //     byHouse,
  //     R.filterWithIndex((houseId) => selectedHouseIds.includes(houseId)),
  //     R.toArray,
  //     A.map(([k, { costs, areas, operationalCo2 }]) => {})
  //   )
  //   // const accum: Record<string, number> = {}

  //   // TODO: query here like in OrderListTable

  //   // const foo = pipe(areas, R.toEntries, A.map(([k,r]) => {}))

  //   // TODO: solve byHouse thing, confirm with clayton

  //   // const cladding: MaterialsListItem = {
  //   //   item: "cladding",
  //   //   quantity: areas.cladding,
  //   //   specification: getMaterialName(houseId, elementName)

  //   // }

  //   // return [cladding]
  //   return []
  // }, [byHouse, selectedHouseIds])

  const { code: currencyCode } = useSiteCurrency()

  const { totalEstimatedCost, totalCarbonCost } = pipe(
    data,
    A.reduce(
      { totalEstimatedCost: 0, totalCarbonCost: 0 },
      ({ totalEstimatedCost, totalCarbonCost }, row) => ({
        totalEstimatedCost: totalEstimatedCost + row.estimatedCost,
        totalCarbonCost: totalCarbonCost + row.carbonCost,
      })
    ),
    R.map(fmt)
  )

  const columnHelper = createColumnHelper<MaterialsListItem>()

  const columns: ColumnDef<MaterialsListItem, any>[] = [
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
      cell: (info) => <span>{`${Number(info.getValue()).toFixed(1)}m²`}</span>,
      header: () => <span>Quantity</span>,
    }),
    columnHelper.accessor("specification", {
      cell: (info) => <span>{info.getValue()}</span>,
      header: () => <span>Specification</span>,
    }),
    columnHelper.accessor("estimatedCostPerUnit", {
      cell: (info) => <span>{`${fmt(info.getValue())}m²`}</span>,
      header: () => <span>Estimated cost per unit</span>,
    }),
    columnHelper.accessor("estimatedCost", {
      cell: (info) => <span>{fmt(info.getValue())}</span>,
      header: () => <span>Estimated cost</span>,
      footer: () => <span>{totalEstimatedCost}</span>,
    }),
    columnHelper.accessor("carbonCost", {
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
  ]

  return (
    <PaginatedTable
      data={data}
      columns={columns}
      setCsvDownloadUrl={setCsvDownloadUrl}
    />
  )
}

export default memo(MaterialsListTable)
