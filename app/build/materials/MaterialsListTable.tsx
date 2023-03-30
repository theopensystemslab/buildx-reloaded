"use client"
import { useSiteCurrency } from "@/hooks/siteCtx"
import { ArrowDown } from "@carbon/icons-react"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import { A, R } from "../../../src/utils/functions"
import { useSelectedHouses } from "../../common/HousesPillsSelector"
import PaginatedTable from "../PaginatedTable"

type MaterialsListItem = {
  item: string
  quantity: number
  specification: string
  estimatedCostPerUnit: number
  estimatedCost: number
  carbonCost: number
  linkUrl: string
}

const MaterialsListTable = () => {
  const selectedHouses = useSelectedHouses()

  const data: MaterialsListItem[] = useMemo(() => {
    const accum: Record<string, number> = {}

    return []

    // for (const blockModuleEntry of blockModulesEntries) {
    //   const { systemId, blockId, moduleIds } = blockModuleEntry

    //   for (let moduleId of moduleIds) {
    //     const key = `${systemId}:${moduleId}:${blockId}`

    //     if (key in accum) {
    //       accum[key] += 1
    //     } else {
    //       accum[key] = 1
    //     }
    //   }
    // }

    // return pipe(
    //   selectedHouses,
    //   A.chain(({ id: houseId, dna: dnas, ...house }) =>
    //     pipe(
    //       dnas,
    //       A.map((dna) => ({
    //         ...pipe(
    //           modules,
    //           A.findFirstMap((module) =>
    //             module.systemId === house.systemId && module.dna === dna
    //               ? O.some({
    //                   module,
    //                   blocks: pipe(
    //                     accum,
    //                     R.filterMapWithIndex((key, count) => {
    //                       const [systemId, moduleId, blockId] = key.split(":")
    //                       return systemId === house.systemId &&
    //                         moduleId === module.id
    //                         ? O.some(
    //                             pipe(
    //                               blocks,
    //                               A.filterMap((block) =>
    //                                 block.systemId === house.systemId &&
    //                                 block.id === blockId
    //                                   ? O.some({
    //                                       blockId,
    //                                       count,
    //                                     })
    //                                   : O.none
    //                               )
    //                             )
    //                           )
    //                         : O.none
    //                     }),
    //                     values,
    //                     A.flatten
    //                   ),
    //                 })
    //               : O.none
    //           ),
    //           O.toNullable
    //         ),
    //       })),
    //       A.reduce({}, (target: Record<string, number>, { blocks }) => {
    //         return produce(target, (draft) => {
    //           blocks?.forEach(({ blockId, count }) => {
    //             if (blockId in draft) {
    //               draft[blockId] += count
    //             } else {
    //               draft[blockId] = count
    //             }
    //           })
    //         })
    //       }),
    //       R.collect(S.Ord)((blockId, count) => ({
    //         buildingName: house.friendlyName,
    //         block: blocks.find(
    //           (block) =>
    //             block.systemId === house.systemId && block.id === blockId
    //         ),
    //         count,
    //         colorClassName:
    //           buildingColorVariants[
    //             selectedHouses.findIndex((x) => x.id === houseId)
    //           ],
    //       }))
    //     )
    //   ),

    //   A.filterMap(
    //     ({
    //       buildingName,
    //       block,
    //       count,
    //       colorClassName,
    //     }): O.Option<BlockLineItem> =>
    //       block
    //         ? O.some({
    //             blockName: block.name,
    //             buildingName,
    //             count,
    //             sheetsPerBlock: block.sheetQuantity,
    //             materialsCost: block.materialsCost * count,
    //             colorClassName,
    //             costPerBlock: block.totalCost,
    //             manufacturingCost: block.manufacturingCost * count,
    //             cuttingFileUrl: block.cuttingFileUrl,
    //             totalCost: block.totalCost * count,
    //           })
    //         : O.none
    //   )
    // )
  }, [])

  const { code: currencyCode } = useSiteCurrency()

  const fmt = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(value)

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
    columnHelper.accessor("item", {
      cell: (info) => <span>{info.getValue()}</span>,
      header: () => <span>Item</span>,
    }),
    columnHelper.accessor("quantity", {
      cell: (info) => <span>{`${info.getValue()}m²`}</span>,
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
      cell: (info) => <span>{`${fmt(info.getValue())} CO₂`}</span>,
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

  return <PaginatedTable data={data} columns={columns} />
}

export default MaterialsListTable
