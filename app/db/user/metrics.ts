import { liveQuery } from "dexie"
import userDB from "."
import systemsDB from "../systems"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { A, O, R, S } from "../../utils/functions"

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

const userDataObserver = liveQuery(async () => {
  const [houses, modules, blocks, blockModulesEntries] = await Promise.all([
    userDB.houses.toArray(),
    systemsDB.modules.toArray(),
    systemsDB.blocks.toArray(),
    systemsDB.blockModuleEntries.toArray(),
  ])
  return { houses, modules, blocks, blockModulesEntries }
})

export const deriveMetrics = () =>
  userDataObserver.subscribe(
    ({ houses, modules, blocks, blockModulesEntries }) => {
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

      userDB.orderListRows.bulkPut(orderListRows)
    }
  )
