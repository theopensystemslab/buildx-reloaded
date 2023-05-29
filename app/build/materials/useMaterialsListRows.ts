import { Module, useGetModuleWindowTypes } from "@/server/data/modules"
import { pipe } from "fp-ts/lib/function"
import { useCallback, useMemo } from "react"
import {
  useGetColorClass,
  useSelectedHouseIds,
} from "~/analyse/ui/HousesPillsSelector"
import { useElements } from "~/data/elements"
import { useGetElementMaterial } from "~/design/state/hashedMaterials"
import houses, { useGetHouseModules } from "~/design/state/houses"
import { A, O } from "~/utils/functions"
import { MaterialsListRow } from "./MaterialsListTable"

export const useMaterialsListRows = () => {
  const selectedHouseIds = useSelectedHouseIds()
  const getColorClass = useGetColorClass()
  const getModuleWindowTypes = useGetModuleWindowTypes()
  const elements = useElements()
  const getElementMaterial = useGetElementMaterial()

  const getHouseModules = useGetHouseModules()

  const getQuantityReducer = useCallback(
    (item: string): ((acc: number, module: Module) => number) => {
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
              moduleWindowTypes.reduce((acc, v) => acc + v.openingPerimeter, 0)
            )
          }

        case "Windows":
          return (acc, module) => {
            const moduleWindowTypes = getModuleWindowTypes(module)
            return (
              acc + moduleWindowTypes.reduce((acc, v) => acc + v.glazingArea, 0)
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
          // console.log(`${item} defaulted`)
          return (acc, module) => 0
      }
    },
    [getModuleWindowTypes]
  )

  const houseMaterialCalculator = useCallback(
    (houseId: string) => {
      const house = houses[houseId]
      const houseModules = getHouseModules(house)

      return pipe(
        elements,
        A.filterMap(({ category, name: item }) => {
          if (["Insulation"].includes(item)) return O.none

          const reducer = getQuantityReducer(item)

          try {
            const {
              specification,
              costPerUnit,
              embodiedCarbonPerUnit,
              linkUrl,
              unit,
            } = getElementMaterial(house.id, item)

            const quantity = pipe(houseModules, A.reduce(0, reducer))

            const cost = costPerUnit * quantity

            const embodiedCarbonCost = embodiedCarbonPerUnit * quantity

            return O.some<MaterialsListRow>({
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
              colorClass: getColorClass(houseId),
              staleColorClass: getColorClass(houseId, { stale: true }),
            })
          } catch (e) {
            return O.none
          }
        })
      )
    },
    [
      elements,
      getColorClass,
      getElementMaterial,
      getHouseModules,
      getQuantityReducer,
    ]
  )

  return useMemo(() => {
    return selectedHouseIds.flatMap(houseMaterialCalculator)
  }, [selectedHouseIds, houseMaterialCalculator])
}
