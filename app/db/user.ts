import Dexie, { liveQuery } from "dexie"
import { useLiveQuery } from "dexie-react-hooks"
import { pipe } from "fp-ts/lib/function"
import { z } from "zod"
import { A, O, R, S } from "../utils/functions"
import systemsDB, { useAllModules } from "./systems"
import { useCallback } from "react"
import { SiteCtx } from "../design/state/siteCtx"
import { values } from "fp-ts-std/Record"
import produce from "immer"

export const houseParser = z.object({
  houseId: z.string().min(1),
  houseTypeId: z.string().min(1),
  systemId: z.string().min(1),
  dnas: z.array(z.string().min(1)),
  activeElementMaterials: z.record(z.string().min(1)),
  friendlyName: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  rotation: z.number(),
})

export type House = z.infer<typeof houseParser>

export const housesToRecord = (housesArray: House[]): Record<string, House> => {
  return pipe(
    housesArray,
    A.reduce({} as Record<string, House>, (acc, house) => ({
      ...acc,
      [house.houseId]: house,
    }))
  )
}

export const housesToArray = (housesRecord: Record<string, House>): House[] => {
  return pipe(
    housesRecord,
    R.toArray,
    A.map(([, house]) => house) // We only care about the House value, not the houseId key.
  )
}

export const useHouses = () => {
  const houses: House[] = useLiveQuery(() => userDB.houses.toArray(), [], [])

  return houses
}

export const useHousesRecord = () => pipe(useHouses(), housesToRecord)

export const useGetHouseModules = () => {
  const houses = useHouses()
  const allSystemsModules = useAllModules()

  return (houseId: string) =>
    pipe(
      houses,
      A.findFirst((x) => x.houseId === houseId),
      O.chain((house) =>
        pipe(
          house.dnas,
          A.traverse(O.Applicative)((dna) =>
            pipe(
              allSystemsModules,
              A.findFirst((x) => x.systemId === house.systemId && x.dna === dna)
            )
          )
        )
      )
    )
}

export const useGetFriendlyName = () => {
  const houses = useHouses()

  const existingNames = pipe(
    houses,
    A.map((x) => x.friendlyName)
  )

  return useCallback(() => {
    let count = houses.length + 1

    let nextName = `Building ${count}`

    while (existingNames.includes(nextName)) {
      nextName = `Building ${++count}`
    }

    return nextName
  }, [existingNames, houses.length])
}

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

class UserDatabase extends Dexie {
  houses: Dexie.Table<House, string>
  siteCtx: Dexie.Table<SiteCtx & { key: string }, string>
  orderListRows: Dexie.Table<OrderListRow, string>
  materialsListRows: Dexie.Table<MaterialsListRow, string>

  constructor() {
    super("UserDatabase")
    this.version(1).stores({
      houses: "houseId,&friendlyName",
      siteCtx: "&key, mode, houseId, levelIndex, projectName, region",
      orderListRows: "[houseId+blockName]",
      materialsListRows: "",
    })
    this.houses = this.table("houses")
    this.siteCtx = this.table("siteCtx")
    this.orderListRows = this.table("orderListRows")
    this.materialsListRows = this.table("materialsListRows")
  }
}

const userDB = new UserDatabase()

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

export default userDB
