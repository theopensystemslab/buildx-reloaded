import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { useMemo } from "react"
import { A, O, R, S } from "~/utils/functions"
import { trpc } from "../../../client/trpc"
import {
  useGetColorClass,
  useSelectedHouses,
} from "../../analyse/ui/HousesPillsSelector"
import { useSiteCurrency } from "../../design/state/siteCtx"

export type OrderListRow = {
  buildingName: string
  houseId: string
  blockName: string
  sheetsPerBlock: number
  count: number
  materialsCost: number // connect  to element Structure's material cost
  manufacturingCost: number
  costPerBlock: number
  colorClass: string
  staleColorClass: string
  cuttingFileUrl: string
  totalCost: number
}

export const useOrderListData = () => {
  const selectedHouses = useSelectedHouses()
  const getColorClass = useGetColorClass()

  const { data: modules = [], status: modulesQueryStatus } =
    trpc.modules.useQuery()
  const { data: blocks = [], status: blocksQueryStatus } =
    trpc.blocks.useQuery()
  const {
    data: blockModulesEntries = [],
    status: blockModulesEntriesQueryStatus,
  } = trpc.blockModulesEntries.useQuery()

  const allStatuses = [
    modulesQueryStatus,
    blocksQueryStatus,
    blockModulesEntriesQueryStatus,
  ]

  const status: typeof modulesQueryStatus = allStatuses.includes("error")
    ? "error"
    : allStatuses.includes("loading")
    ? "loading"
    : "success"

  const orderListRows = useMemo(() => {
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
      A.chain(({ id: houseId, dnas: dnas, ...house }) =>
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
          (x) => x,
          R.collect(S.Ord)((blockId, count) => {
            return {
              buildingName: house.friendlyName,
              houseId,
              block: blocks.find(
                (block) =>
                  block.systemId === house.systemId && block.id === blockId
              ),
              count,
              colorClass: getColorClass(houseId),
              staleColorClass: getColorClass(houseId, { stale: true }),
            }
          })
        )
      ),
      A.filterMap(
        ({
          houseId,
          buildingName,
          block,
          count,
          colorClass,
          staleColorClass,
        }): O.Option<OrderListRow> =>
          block
            ? O.some({
                houseId,
                blockName: block.name,
                buildingName,
                count,
                sheetsPerBlock: block.sheetQuantity,
                materialsCost: block.materialsCost * count,
                colorClass,
                staleColorClass,
                costPerBlock: block.totalCost,
                manufacturingCost: block.manufacturingCost * count,
                cuttingFileUrl: block.cuttingFileUrl,
                totalCost: block.totalCost * count,
              })
            : O.none
      )
    )
  }, [blockModulesEntries, blocks, getColorClass, modules, selectedHouses])

  const blockCountsByHouse = pipe(
    orderListRows,
    A.reduce({}, (acc: Record<string, number>, row: OrderListRow) => {
      if (row.houseId in acc) {
        acc[row.houseId] += row.count
      } else {
        acc[row.houseId] = row.count
      }
      return acc
    })
  )

  const { code: currencyCode } = useSiteCurrency()

  const fmt = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(value)

  const { totalMaterialCost, totalManufacturingCost, totalTotalCost } = pipe(
    orderListRows,
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

  return {
    totalMaterialCost,
    totalManufacturingCost,
    totalTotalCost,
    orderListRows,
    blockCountsByHouse,
    status,
    fmt,
  }
}
