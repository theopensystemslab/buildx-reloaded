import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import {
  useGetElementMaterial,
  useGetElementMaterialName,
} from "~/design/state/hashedMaterials"
import { A, O, R } from "~/utils/functions"
import { useAnalyseData } from "../../analyse/state/data"
import {
  useGetColorClass,
  useSelectedHouses,
} from "../../analyse/ui/HousesPillsSelector"
import { useSiteCurrency } from "../../design/state/siteCtx"

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

  const data: MaterialsListRow[] = useMemo(() => {
    const foo: MaterialsListRow[] = pipe(
      selectedHouses,
      A.filterMap((house) =>
        pipe(
          byHouse,
          R.lookup(house.id),
          O.map(({ areas, costs }): MaterialsListRow[] => {
            const sharedProps = {
              buildingName: house.friendlyName,
              colorClass: getColorClass(house.id),
              staleColorClass: getColorClass(house.id, { stale: true }),
            }

            const claddingMaterial = getElementMaterial(house.id, "Cladding")

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

  return { data, fmt }
}
