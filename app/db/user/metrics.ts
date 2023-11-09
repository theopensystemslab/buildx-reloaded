import { liveQuery } from "dexie"
import userDB, { House, useBuildingHouseId, useHousesRecord } from "."
import systemsDB from "../systems"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { A, O, R, S } from "../../utils/functions"
import { useSelectedHouseIds } from "../../analyse/ui/HousesPillsSelector"
import { useLiveQuery } from "dexie-react-hooks"
import {
  SiteCtxModeEnum,
  getModeBools,
  useSiteCtx,
  useSiteCurrency,
} from "../../design/state/siteCtx"
import { useMemo } from "react"

export type OrderListRow = {
  buildingName: string
  houseId: string
  blockName: string
  sheetsPerBlock: number
  count: number
  materialsCost: number // connect  to element Structure's material cost
  manufacturingCost: number
  costPerBlock: number
  // colorClass: string
  // staleColorClass: string
  cuttingFileUrl: string
  totalCost: number
}

export type MaterialsListRow = {
  buildingName: string
  item: string
  category: string
  unit: string | null
  quantity: number
  specification: string
  costPerUnit: number
  cost: number
  embodiedCarbonPerUnit: number
  embodiedCarbonCost: number
  linkUrl?: string
  // colorClass: string
  // categoryColorClass: string
}

export const useAllOrderListRows = (): OrderListRow[] =>
  useLiveQuery(() => userDB.orderListRows.toArray(), [], [])

export const useSelectedHouseOrderListRows = (): OrderListRow[] => {
  const selectedHouseIds = useSelectedHouseIds()

  return useLiveQuery(
    () =>
      userDB.orderListRows.where("houseId").anyOf(selectedHouseIds).toArray(),
    [selectedHouseIds],
    []
  )
}

export const useMetricsOrderListRows = (): OrderListRow[] => {
  const buildingHouseId = useBuildingHouseId()

  return useLiveQuery(
    () =>
      buildingHouseId
        ? userDB.orderListRows
            .where("houseId")
            .equals(buildingHouseId)
            .toArray()
        : userDB.orderListRows.toArray(),
    [buildingHouseId],
    []
  )
}

const userDataObserver = liveQuery(async () => {
  const [houses, modules, blocks, blockModulesEntries] = await Promise.all([
    userDB.houses.toArray(),
    systemsDB.modules.toArray(),
    systemsDB.blocks.toArray(),
    systemsDB.blockModuleEntries.toArray(),
  ])
  return { houses, modules, blocks, blockModulesEntries }
})

userDataObserver.subscribe(
  ({ houses, modules, blocks, blockModulesEntries }) => {
    console.log("subscriber")
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

    const orderListRows = pipe(
      houses,
      A.chain(({ houseId: houseId, dnas: dnas, ...house }) =>
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
              // colorClass: getColorClass(houseId),
              // staleColorClass: getColorClass(houseId, { stale: true }),
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
          // colorClass,
          // staleColorClass,
        }): O.Option<OrderListRow> =>
          block
            ? O.some({
                houseId,
                blockName: block.name,
                buildingName,
                count,
                sheetsPerBlock: block.sheetQuantity,
                materialsCost: block.materialsCost * count,
                // colorClass,
                // staleColorClass,
                costPerBlock: block.totalCost,
                manufacturingCost: block.manufacturingCost * count,
                cuttingFileUrl: block.cuttingFileUrl,
                totalCost: block.totalCost * count,
              })
            : O.none
      )
    )

    console.log({ orderListRows })

    userDB.orderListRows.bulkPut(orderListRows)
  }
)

export const buildingColorVariants: Record<number, string> = {
  0: "bg-building-1",
  1: "bg-building-2",
  2: "bg-building-3",
  3: "bg-building-4",
  4: "bg-building-5",
  5: "bg-building-6",
  6: "bg-building-7",
  7: "bg-building-8",
  8: "bg-building-9",
  9: "bg-building-10",
  10: "bg-building-11",
  11: "bg-building-12",
  12: "bg-building-13",
  13: "bg-building-14",
  14: "bg-building-15",
  15: "bg-building-16",
  16: "bg-building-17",
  17: "bg-building-18",
  18: "bg-building-19",
  19: "bg-building-20",
}

export const staleColorVariants: Record<number, string> = {
  0: "bg-grey-50",
  1: "bg-grey-40",
  2: "bg-grey-30",
  3: "bg-grey-80",
  4: "bg-grey-70",
  5: "bg-grey-60",
}

export const useGetColorClass = () => {
  const selectedHouseIds = useSelectedHouseIds()

  return (houseId: string, opts: { stale?: boolean } = {}) => {
    const { stale = false } = opts
    const index = selectedHouseIds.indexOf(houseId)
    return stale ? staleColorVariants[index] : buildingColorVariants[index]
  }
}

export const useOrderListData = () => {
  const orderListRows = useSelectedHouseOrderListRows()

  // const getColorClass = useGetColorClass()

  // const modules = useAllModules()

  // const blocks = useAllBlocks()

  // const blockModulesEntries = useAllBlockModulesEntries()

  // const orderListRows = useMemo(() => {
  //   const accum: Record<string, number> = {}

  //   for (const blockModuleEntry of blockModulesEntries) {
  //     const { systemId, blockId, moduleIds } = blockModuleEntry

  //     for (let moduleId of moduleIds) {
  //       const key = `${systemId}:${moduleId}:${blockId}`

  //       if (key in accum) {
  //         accum[key] += 1
  //       } else {
  //         accum[key] = 1
  //       }
  //     }
  //   }

  //   return pipe(
  //     selectedHouses,
  //     A.chain(({ houseId: houseId, dnas: dnas, ...house }) =>
  //       pipe(
  //         dnas,
  //         A.map((dna) => ({
  //           ...pipe(
  //             modules,
  //             A.findFirstMap((module) =>
  //               module.systemId === house.systemId && module.dna === dna
  //                 ? O.some({
  //                     module,
  //                     blocks: pipe(
  //                       accum,
  //                       R.filterMapWithIndex((key, count) => {
  //                         const [systemId, moduleId, blockId] = key.split(":")
  //                         return systemId === house.systemId &&
  //                           moduleId === module.id
  //                           ? O.some(
  //                               pipe(
  //                                 blocks,
  //                                 A.filterMap((block) =>
  //                                   block.systemId === house.systemId &&
  //                                   block.id === blockId
  //                                     ? O.some({
  //                                         blockId,
  //                                         count,
  //                                       })
  //                                     : O.none
  //                                 )
  //                               )
  //                             )
  //                           : O.none
  //                       }),
  //                       values,
  //                       A.flatten
  //                     ),
  //                   })
  //                 : O.none
  //             ),
  //             O.toNullable
  //           ),
  //         })),
  //         A.reduce({}, (target: Record<string, number>, { blocks }) => {
  //           return produce(target, (draft) => {
  //             blocks?.forEach(({ blockId, count }) => {
  //               if (blockId in draft) {
  //                 draft[blockId] += count
  //               } else {
  //                 draft[blockId] = count
  //               }
  //             })
  //           })
  //         }),
  //         (x) => x,
  //         R.collect(S.Ord)((blockId, count) => {
  //           return {
  //             buildingName: house.friendlyName,
  //             houseId,
  //             block: blocks.find(
  //               (block) =>
  //                 block.systemId === house.systemId && block.id === blockId
  //             ),
  //             count,
  //             colorClass: getColorClass(houseId),
  //             staleColorClass: getColorClass(houseId, { stale: true }),
  //           }
  //         })
  //       )
  //     ),
  //     A.filterMap(
  //       ({
  //         houseId,
  //         buildingName,
  //         block,
  //         count,
  //         colorClass,
  //         staleColorClass,
  //       }): O.Option<OrderListRow> =>
  //         block
  //           ? O.some({
  //               houseId,
  //               blockName: block.name,
  //               buildingName,
  //               count,
  //               sheetsPerBlock: block.sheetQuantity,
  //               materialsCost: block.materialsCost * count,
  //               colorClass,
  //               staleColorClass,
  //               costPerBlock: block.totalCost,
  //               manufacturingCost: block.manufacturingCost * count,
  //               cuttingFileUrl: block.cuttingFileUrl,
  //               totalCost: block.totalCost * count,
  //             })
  //           : O.none
  //     )
  //   )
  // }, [blockModulesEntries, blocks, getColorClass, modules, selectedHouses])

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
    fmt,
  }
}
