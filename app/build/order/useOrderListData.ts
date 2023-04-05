import { useSiteCurrency } from "@/hooks/siteCtx"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { useMemo } from "react"
import { trpc } from "../../../client/trpc"
import { A, O, R, S } from "../../../src/utils/functions"
import {
  buildingColorVariants,
  staleColorVariants,
  useSelectedHouses,
} from "../../common/HousesPillsSelector"

export type OrderListRow = {
  buildingName: string
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
          R.collect(S.Ord)((blockId, count) => {
            const index = selectedHouses.findIndex((x) => x.id === houseId)

            return {
              buildingName: house.friendlyName,
              block: blocks.find(
                (block) =>
                  block.systemId === house.systemId && block.id === blockId
              ),
              count,
              colorClass:
                buildingColorVariants[
                  index % Object.keys(buildingColorVariants).length
                ],
              staleColorClass:
                staleColorVariants[
                  index % Object.keys(staleColorVariants).length
                ],
            }
          })
        )
      ),

      A.filterMap(
        ({
          buildingName,
          block,
          count,
          colorClass,
          staleColorClass,
        }): O.Option<OrderListRow> =>
          block
            ? O.some({
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

  return {
    totalMaterialCost,
    totalManufacturingCost,
    totalTotalCost,
    orderListData: data,
    status,
    fmt,
  }
}
