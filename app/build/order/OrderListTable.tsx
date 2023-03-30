"use client"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { useSiteCurrency } from "@/hooks/siteCtx"
import { capitalizeFirstLetters } from "@/utils/functions"
import PaginatedTable from "../PaginatedTable"
import clsx from "clsx"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { useMemo } from "react"
import { trpc } from "../../../client/trpc"
import { A, O, R, S } from "../../../src/utils/functions"
import {
  buildingColorVariants,
  useSelectedHouses,
} from "../../common/HousesPillsSelector"
import { ArrowDown } from "@carbon/icons-react"

export type BlockLineItem = {
  buildingName: string
  blockName: string
  sheetsPerBlock: number
  count: number
  materialsCost: number // connect  to element Structure's material cost
  manufacturingCost: number
  costPerBlock: number
  colorClassName: string
  cuttingFileUrl: string
  totalCost: number
}

const OrderListTable = () => {
  const selectedHouses = useSelectedHouses()
  const { data: modules = [] } = trpc.modules.useQuery()
  const { data: blocks = [] } = trpc.blocks.useQuery()
  const { data: blockModulesEntries = [] } = trpc.blockModulesEntries.useQuery()

  const data = useMemo(() => {
    const accum: Record<string, number> = {}

    for (const blockModuleEntry of blockModulesEntries) {
      const { systemId, blockId, moduleIds } = blockModuleEntry

      for (let moduleId of moduleIds) {
        const key = `${systemId}:${moduleId}:${blockId}`

        if (key in accum) {
          accum[key] += 1
        } else {
          accum[key] = 1
        }
      }
    }

    return pipe(
      selectedHouses,
      A.chain(({ id: houseId, dna: dnas, ...house }) =>
        pipe(
          dnas,
          A.map((dna) => ({
            ...pipe(
              modules,
              A.findFirstMap((module) =>
                module.systemId === house.systemId && module.dna === dna
                  ? O.some({
                      module,
                      blocks: pipe(
                        accum,
                        R.filterMapWithIndex((key, count) => {
                          const [systemId, moduleId, blockId] = key.split(":")
                          return systemId === house.systemId &&
                            moduleId === module.id
                            ? O.some(
                                pipe(
                                  blocks,
                                  A.filterMap((block) =>
                                    block.systemId === house.systemId &&
                                    block.id === blockId
                                      ? O.some({
                                          blockId,
                                          count,
                                        })
                                      : O.none
                                  )
                                )
                              )
                            : O.none
                        }),
                        values,
                        A.flatten
                      ),
                    })
                  : O.none
              ),
              O.toNullable
            ),
          })),
          A.reduce({}, (target: Record<string, number>, { blocks }) => {
            return produce(target, (draft) => {
              blocks?.forEach(({ blockId, count }) => {
                if (blockId in draft) {
                  draft[blockId] += count
                } else {
                  draft[blockId] = count
                }
              })
            })
          }),
          R.collect(S.Ord)((blockId, count) => ({
            buildingName: house.friendlyName,
            block: blocks.find(
              (block) =>
                block.systemId === house.systemId && block.id === blockId
            ),
            count,
            colorClassName:
              buildingColorVariants[
                selectedHouses.findIndex((x) => x.id === houseId)
              ],
          }))
        )
      ),

      A.filterMap(
        ({
          buildingName,
          block,
          count,
          colorClassName,
        }): O.Option<BlockLineItem> =>
          block
            ? O.some({
                blockName: block.name,
                buildingName,
                count,
                sheetsPerBlock: block.sheetQuantity,
                materialsCost: block.materialsCost * count,
                colorClassName,
                costPerBlock: block.totalCost,
                manufacturingCost: block.manufacturingCost * count,
                cuttingFileUrl: block.cuttingFileUrl,
                totalCost: block.totalCost * count,
              })
            : O.none
      )
    )
  }, [blockModulesEntries, blocks, modules, selectedHouses])

  const { code: currencyCode } = useSiteCurrency()

  const fmt = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(value)

  const { totalMaterialCost, totalManufacturingCost, totalTotalCost } = pipe(
    data,
    A.reduce(
      { totalMaterialCost: 0, totalManufacturingCost: 0, totalTotalCost: 0 },
      ({ totalMaterialCost, totalManufacturingCost, totalTotalCost }, row) => ({
        totalMaterialCost: totalMaterialCost + row.materialsCost,
        totalManufacturingCost: totalManufacturingCost + row.manufacturingCost,
        totalTotalCost: totalTotalCost + row.totalCost,
      })
    ),
    R.map(fmt)
  )

  const columnHelper = createColumnHelper<BlockLineItem>()

  const columns: ColumnDef<BlockLineItem, any>[] = [
    columnHelper.accessor("buildingName", {
      cell: (info) => {
        return (
          <div
            className={clsx("w-full h-full", {
              [info.row.original.colorClassName]:
                info.cell.column.id === "buildingName",
            })}
          >
            {capitalizeFirstLetters(info.getValue())}
          </div>
        )
      },
      header: () => null,
    }),
    columnHelper.accessor("blockName", {
      cell: (info) => <span>{info.getValue()}</span>,
      header: () => <span>Block type</span>,
      footer: () => <span>Total</span>,
    }),
    columnHelper.accessor("count", {
      cell: (info) => <span>{info.getValue()}</span>,
      header: () => <span>Number</span>,
    }),
    columnHelper.accessor("costPerBlock", {
      cell: (info) => <span>{fmt(info.getValue())}</span>,
      header: () => <span>Cost per Block</span>,
    }),
    columnHelper.accessor("materialsCost", {
      cell: (info) => <span>{fmt(info.getValue())}</span>,
      header: () => <span>Material Cost</span>,
      footer: () => <span>{totalMaterialCost}</span>,
      // aggregatedCell: (info) => <span>{fmt(info.getValue())}</span>,
      // aggregationFn: "sum",
      // enableGrouping: true,
    }),
    columnHelper.accessor("manufacturingCost", {
      cell: (info) => <span>{fmt(info.getValue())}</span>,
      header: () => <span>Manufacturing Cost</span>,
      footer: () => <span>{totalManufacturingCost}</span>,
    }),
    columnHelper.accessor("cuttingFileUrl", {
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
      cell: (info) => <span>{fmt(info.getValue())}</span>,
      header: () => <span>Total cost</span>,
      footer: () => <span>{`${totalTotalCost} + VAT`}</span>,
    }),
  ]

  return <PaginatedTable data={data} columns={columns} />
}

export default OrderListTable
