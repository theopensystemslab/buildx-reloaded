import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import {
  useGetElementMaterial,
  useGetElementMaterialName,
} from "../../../src/hooks/hashedMaterials"
import { useSiteCurrency } from "../../../src/hooks/siteCtx"
import { A, O, R } from "../../../src/utils/functions"
import { useAnalyseData } from "../../analyse/data"
import {
  useGetColorClass,
  useSelectedHouseIds,
  useSelectedHouses,
} from "../../common/HousesPillsSelector"

export type MaterialsListRow = {
  buildingName: string
  item: string
  quantity: number
  specification: string
  estimatedCostPerUnit: number
  estimatedCost: number
  carbonCost: number
  linkUrl: string
  colorClass: string
  staleColorClass: string
}

export const useMaterialsListData = () => {
  const getColorClass = useGetColorClass()

  const { byHouse } = useAnalyseData()

  const { code: currencyCode } = useSiteCurrency()

  const fmt = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(value)

  const selectedHouses = useSelectedHouses()

  const getElementMaterialName = useGetElementMaterialName()
  const getElementMaterial = useGetElementMaterial()

  const materialsListData: MaterialsListRow[] = useMemo(() => {
    const foo: MaterialsListRow[] = pipe(
      selectedHouses,
      A.filterMap((house) =>
        pipe(
          byHouse,
          R.lookup(house.id),
          O.map(({ areas, costs, operationalCo2 }): MaterialsListRow[] => {
            // we probably need to for each the 3 special elements here

            const sharedProps = {
              buildingName: house.friendlyName,
              colorClass: getColorClass(house.id),
              staleColorClass: getColorClass(house.id, { stale: true }),
            }

            const claddingMaterial = getElementMaterial(house.id, "Cladding")

            console.log({ claddingMaterial })

            const cladding: MaterialsListRow = {
              ...sharedProps,
              carbonCost: claddingMaterial.embodiedCarbonPerM2 * areas.cladding,
              estimatedCost: costs.cladding,
              estimatedCostPerUnit: claddingMaterial.costPerM2,
              item: "Cladding",
              linkUrl: "#",
              quantity: areas.cladding,
              specification: getElementMaterialName(house.id, "Cladding"),
            }

            const liningMaterial = getElementMaterial(
              house.id,
              "Internal wall lining"
            )

            const lining: MaterialsListRow = {
              ...sharedProps,
              carbonCost:
                liningMaterial.embodiedCarbonPerM2 * areas.internalLining,
              estimatedCost: costs.internalLining,
              estimatedCostPerUnit: liningMaterial.costPerM2,
              item: "Internal Lining",
              linkUrl: "#",
              quantity: areas.internalLining,
              specification: getElementMaterialName(
                house.id,
                "Internal wall lining"
              ),
            }

            const roofing: MaterialsListRow = {
              ...sharedProps,
              carbonCost: 0,
              estimatedCost: 0,
              estimatedCostPerUnit: 0,
              item: "Roofing",
              linkUrl: "#",
              quantity: 0,
              specification: "spec", //getElementMaterialName(house.id, "Roofing"),
            }

            console.log({ cladding, lining, roofing })

            return [cladding, lining, roofing]
          })
        )
      ),
      A.flatten
    )
    return foo
  }, [
    byHouse,
    getColorClass,
    getElementMaterial,
    getElementMaterialName,
    selectedHouses,
  ])

  return { data: materialsListData, fmt }

  // const data = useMemo(() => {
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
  //     A.chain(({ id: houseId, dnas: dnas, ...house }) =>
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
  //         R.collect(S.Ord)((blockId, count) => {
  //           const index = selectedHouses.findIndex((x) => x.id === houseId)

  //           return {
  //             buildingName: house.friendlyName,
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
  //         buildingName,
  //         block,
  //         count,
  //         colorClass,
  //         staleColorClass,
  //       }): O.Option<OrderListRow> =>
  //         block
  //           ? O.some({
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

  // const { code: currencyCode } = useSiteCurrency()

  // const fmt = (value: number) =>
  //   new Intl.NumberFormat("en-US", {
  //     style: "currency",
  //     currency: currencyCode,
  //   }).format(value)

  // const { totalMaterialCost, totalManufacturingCost, totalTotalCost } = pipe(
  //   data,
  //   A.reduce(
  //     { totalMaterialCost: 0, totalManufacturingCost: 0, totalTotalCost: 0 },
  //     ({ totalMaterialCost, totalManufacturingCost, totalTotalCost }, row) => ({
  //       totalMaterialCost: totalMaterialCost + row.materialsCost,
  //       totalManufacturingCost: totalManufacturingCost + row.manufacturingCost,
  //       totalTotalCost: totalTotalCost + row.totalCost,
  //     })
  //   ),
  //   R.map(fmt)
  // )

  // return {
  //   totalMaterialCost,
  //   totalManufacturingCost,
  //   totalTotalCost,
  //   orderListData: data,
  //   status,
  //   fmt,
  // }
}
