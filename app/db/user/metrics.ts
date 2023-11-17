import { liveQuery } from "dexie"
import { useLiveQuery } from "dexie-react-hooks"
import { values } from "fp-ts-std/Record"
import { identity, pipe } from "fp-ts/lib/function"
import produce from "immer"
import userDB, { House, housesToRecord, useBuildingHouseId } from "."
import { Module } from "../../../server/data/modules"
import { WindowType } from "../../../server/data/windowTypes"
import { useSelectedHouseIds } from "../../analyse/ui/HousesPillsSelector"
import { useSiteCurrency } from "../../design/state/siteCtx"
import {
  ElementNotFoundError,
  MaterialNotFoundError,
} from "../../design/ui-3d/fresh/systems"
import { A, O, R, S } from "../../utils/functions"
import systemsDB from "../systems"

export type OrderListRow = {
  houseId: string
  blockName: string
  buildingName: string
  sheetsPerBlock: number
  count: number
  materialsCost: number // connect  to element Structure's material cost
  manufacturingCost: number
  costPerBlock: number
  cuttingFileUrl: string
  totalCost: number
}

export type MaterialsListRow = {
  houseId: string
  item: string
  buildingName: string
  category: string
  unit: string | null
  quantity: number
  specification: string
  costPerUnit: number
  cost: number
  embodiedCarbonPerUnit: number
  embodiedCarbonCost: number
  linkUrl?: string
}

export const useAllOrderListRows = (): OrderListRow[] =>
  useLiveQuery(() => userDB.orderListRows.toArray(), [], [])

export const useAllMaterialsListRows = (): MaterialsListRow[] =>
  useLiveQuery(() => userDB.materialsListRows.toArray(), [], [])

export const useSelectedHouseOrderListRows = (): OrderListRow[] => {
  const selectedHouseIds = useSelectedHouseIds()

  return useLiveQuery(
    () =>
      userDB.orderListRows.where("houseId").anyOf(selectedHouseIds).toArray(),
    [selectedHouseIds],
    []
  )
}

export const useSelectedHouseMaterialsListRows = (): MaterialsListRow[] => {
  const selectedHouseIds = useSelectedHouseIds()

  return useLiveQuery(
    () =>
      userDB.materialsListRows
        .where("houseId")
        .anyOf(selectedHouseIds)
        .toArray(),
    [selectedHouseIds],
    []
  )
}

export const useMaterialsListData = () => {}

export const useMetricsOrderListRows = (): OrderListRow[] => {
  const buildingHouseId = useBuildingHouseId()

  return useLiveQuery(
    () => {
      if (buildingHouseId) {
        return userDB.orderListRows
          .where("houseId")
          .equals(buildingHouseId)
          .toArray()
      } else {
        return userDB.orderListRows.toArray()
      }
    },
    [buildingHouseId],
    []
  )
}

const orderListDeps = liveQuery(async () => {
  const [houses, modules, blocks, blockModulesEntries] = await Promise.all([
    userDB.houses.toArray(),
    systemsDB.modules.toArray(),
    systemsDB.blocks.toArray(),
    systemsDB.blockModuleEntries.toArray(),
  ])
  return { houses, modules, blocks, blockModulesEntries }
})

const materialsListDeps = liveQuery(async () => {
  const [modules, elements, materials, windowTypes, houses, orderListRows] =
    await Promise.all([
      systemsDB.modules.toArray(),
      systemsDB.elements.toArray(),
      systemsDB.materials.toArray(),
      systemsDB.windowTypes.toArray(),
      userDB.houses.toArray(),
      userDB.orderListRows.toArray(),
    ])
  return {
    modules,
    elements,
    materials,
    windowTypes,
    houses,
    orderListRows,
  }
})

export const materialsListSub = () =>
  materialsListDeps.subscribe(
    ({ modules, elements, materials, windowTypes, houses, orderListRows }) => {
      const housesRecord = housesToRecord(houses)

      const getElementMaterial = (houseId: string, elementName: string) => {
        const house = housesRecord[houseId]

        const materialName =
          elementName in house.activeElementMaterials
            ? house.activeElementMaterials[elementName]
            : pipe(
                elements,
                A.findFirstMap((el) =>
                  el.name === elementName ? O.some(el.defaultMaterial) : O.none
                ),
                O.fold(() => {
                  throw new ElementNotFoundError(elementName, house.systemId)
                }, identity)
              )

        return pipe(
          materials,
          A.findFirst((x) => x.specification === materialName),
          O.fold(() => {
            throw new MaterialNotFoundError(elementName, house.systemId)
          }, identity)
        )
      }

      const getHouseModules = (houseId: string) =>
        pipe(
          houses,
          A.findFirst((x) => x.houseId === houseId),
          O.chain((house) =>
            pipe(
              house.dnas,
              A.traverse(O.Applicative)((dna) =>
                pipe(
                  modules,
                  A.findFirst(
                    (x) => x.systemId === house.systemId && x.dna === dna
                  )
                )
              )
            )
          )
        )
      const getModuleWindowTypes = (module: Module) =>
        pipe(
          module.structuredDna,
          R.reduceWithIndex(S.Ord)([], (key, acc: WindowType[], value) => {
            switch (key) {
              case "windowTypeEnd":
              case "windowTypeSide1":
              case "windowTypeSide2":
              case "windowTypeTop":
                return pipe(
                  windowTypes,
                  A.findFirstMap((wt) =>
                    wt.code === value ? O.some([...acc, wt]) : O.none
                  ),
                  O.getOrElse(() => acc)
                )
              default:
                return acc
            }
          })
        )
      const getQuantityReducer = (
        item: string
      ): ((acc: number, module: Module) => number) => {
        switch (item) {
          case "Pile footings":
            return (acc, module) => acc + module.footingsCount

          case "In-situ concrete":
            return (acc, module) => acc + module.concreteVolume

          case "Ridge beam":
            return (acc, { lengthDims }) => acc + lengthDims

          case "External breather membrane":
            return (acc, { claddingArea, roofingArea, floorArea }) =>
              acc + claddingArea + roofingArea + floorArea

          case "Cladding":
          case "Battens":
            return (acc, { claddingArea }) => acc + claddingArea

          case "Roofing":
            return (acc, { roofingArea }) => acc + roofingArea

          case "Window trim":
            return (acc, module) => {
              const moduleWindowTypes = getModuleWindowTypes(module)
              return (
                acc +
                moduleWindowTypes.reduce(
                  (acc, v) => acc + v.openingPerimeter,
                  0
                )
              )
            }

          case "Windows":
            return (acc, module) => {
              const moduleWindowTypes = getModuleWindowTypes(module)
              return (
                acc +
                moduleWindowTypes.reduce((acc, v) => acc + v.glazingArea, 0)
              )
            }

          case "Doors":
            return (acc, module) => {
              const moduleWindowTypes = getModuleWindowTypes(module)
              return (
                acc + moduleWindowTypes.reduce((acc, v) => acc + v.doorArea, 0)
              )
            }

          case "Flashings":
            return (acc, module) => acc + module.flashingArea

          case "Gutters and downpipes":
            return (acc, module) =>
              acc + module.gutterLength + module.downpipeLength

          case "Flooring":
            return (acc, module) => acc + module.floorArea

          case "Internal lining":
            return (acc, module) => acc + module.liningArea

          case "Decking":
            return (acc, module) => acc + module.deckingArea

          case "Sole plate":
            return (acc, module) => acc + module.soleplateLength

          case "Space heating":
          case "Mechanical ventilation":
          case "Electrical and lighting":
          default:
            return (acc, module) => 0
        }
      }

      const blockCountsByHouse = getBlockCountsByHouse(orderListRows)

      const houseMaterialCalculator = (house: House): MaterialsListRow[] => {
        const { houseId } = house
        const houseModules = getHouseModules(houseId)

        const elementRows: MaterialsListRow[] = pipe(
          elements,
          A.filterMap(({ category, name: item }) => {
            if (["Insulation"].includes(item)) return O.none

            // if (!categories.includes(category)) categories.push(category)

            const reducer = getQuantityReducer(item)

            try {
              const material = getElementMaterial(houseId, item)

              const {
                specification,
                costPerUnit,
                embodiedCarbonPerUnit,
                linkUrl,
                unit,
              } = material

              const quantity = pipe(
                houseModules,
                O.map(A.reduce(0, reducer)),
                O.getOrElse(() => 0)
              )

              const cost = costPerUnit * quantity

              const embodiedCarbonCost = embodiedCarbonPerUnit * quantity

              return O.some<MaterialsListRow>({
                houseId,
                buildingName: house.friendlyName,
                item,
                category,
                unit,
                quantity,
                specification,
                costPerUnit,
                cost,
                embodiedCarbonPerUnit,
                embodiedCarbonCost,
                linkUrl,
              })
            } catch (e) {
              if (e instanceof MaterialNotFoundError) {
                console.log(`MaterialNotFoundError: ${e.message}`)
                return O.none
              } else if (e instanceof ElementNotFoundError) {
                console.error(`ElementNotFoundError: ${e.message}`)
                throw e
              } else {
                throw e
              }
            }
          })
        )

        const augmentedRows: MaterialsListRow[] = [
          {
            houseId,
            buildingName: house.friendlyName,
            item: "WikiHouse blocks",
            category: "Structure",
            unit: null,
            quantity: blockCountsByHouse[houseId],
            specification: "Insulated WikiHouse blocks",
            costPerUnit: 0,
            cost: 0,
            embodiedCarbonPerUnit: 0,
            embodiedCarbonCost: 0,
            linkUrl: "",
          },
        ]

        return [...elementRows, ...augmentedRows].sort((a, b) =>
          a.category.localeCompare(b.category)
        )
      }

      const materialsListRows = houses.flatMap(houseMaterialCalculator)

      userDB.materialsListRows.bulkPut(materialsListRows)
    }
  )

export const orderListSub = () =>
  orderListDeps.subscribe(
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
              }
            })
          )
        ),
        A.filterMap(
          ({ houseId, buildingName, block, count }): O.Option<OrderListRow> =>
            block
              ? O.some({
                  houseId,
                  blockName: block.name,
                  buildingName,
                  count,
                  sheetsPerBlock: block.sheetQuantity,
                  materialsCost: block.materialsCost * count,
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

const getBlockCountsByHouse = A.reduce(
  {},
  (acc: Record<string, number>, row: OrderListRow) => {
    if (row.houseId in acc) {
      acc[row.houseId] += row.count
    } else {
      acc[row.houseId] = row.count
    }
    return acc
  }
)

export const useOrderListData = () => {
  const orderListRows = useSelectedHouseOrderListRows()

  const { code: currencyCode } = useSiteCurrency()

  const fmt = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
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
    blockCountsByHouse: getBlockCountsByHouse(orderListRows),
    fmt,
  }
}
