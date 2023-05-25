import { pipe } from "fp-ts/lib/function"
import { useSelectedHouses } from "~/analyse/ui/HousesPillsSelector"
import { useGetElementMaterial } from "~/design/state/hashedMaterials"
import { useGetHouseModules } from "~/design/state/houses"
import { Module, useGetModuleWindowTypes } from "@/server/data/modules"
import { A, O } from "~/utils/functions"
import { House } from "~/data/houses"
import { useElements } from "~/data/elements"
import { MaterialsListRow } from "./MaterialsListTable"

// const elementCalculationPartitions = {
//   zero: [
//     "Space heating",
//     "Plumbing fixtures",
//     "Electrical & lighting",
//     "Mechanical ventilation",
//     "Solar PV system",
//   ],
//   default: [
//     "Internal vapour barrier",
//     "Internal lining",
//     "Flooring",
//     "Decking",
//     "Pile footings",
//     "In-situ concrete",
//     "Sole plate",
//     "Ridge beam",
//     "External breather membrane",
//     "Cladding and battens",
//     "Roofing",
//     "Window trim",
//     "Flashings",
//     "Guttering",
//     "Downpipes",
//     "Windows",
//     "Doors",
//   ],
// }

// export const quantityGetters = {
//   "Pile footings": (mod: Module) => 0,
//   "In-situ concrete": (module: Module) => ({ value: module.cost, unit: "m2" }),
// }

// type MaterialsListRow = {
//   buildingName: string
//   item: string
//   category: string
//   unit: string
//   quantity: number
//   specification: string
//   costPerUnit: number
//   carbonCostPerUnit: number
//   linkUrl: string
// }

export const useMaterialsListRows = () => {
  const selectedHouses = useSelectedHouses()
  const getModuleWindowTypes = useGetModuleWindowTypes()
  const elements = useElements()
  const getElementMaterial = useGetElementMaterial()

  const getHouseModules = useGetHouseModules()

  type QuantityReducer = (acc: number, module: Module) => number

  type QuantityCalculatorOutput = {
    reducer: QuantityReducer
    unit: string
  }

  const getQuantityCalculator = (item: string): QuantityCalculatorOutput => {
    switch (item) {
      case "In-situ concrete":
        return {
          reducer: (acc, module) => acc + module.concreteVolume,
          unit: "m³",
        }
      case "Ridge beam":
        return {
          reducer: (acc, { lengthDims }) => acc + lengthDims,
          unit: "m",
        }
      case "External breather membrance":
        return {
          reducer: (acc, { claddingArea, roofingArea, floorArea }) =>
            acc + claddingArea + roofingArea + floorArea,
          unit: "m²",
        }
      case "Cladding and battens":
        return {
          reducer: (acc, { claddingArea }) => acc + claddingArea,
          unit: "m²",
        }
      case "Roofing":
        return {
          reducer: (acc, { roofingArea }) => acc + roofingArea,
          unit: "m²",
        }
      case "Window trim":
        return {
          reducer: (acc, module) => {
            const moduleWindowTypes = getModuleWindowTypes(module)
            return (
              acc +
              moduleWindowTypes.reduce((acc, v) => acc + v.openingPerimeter, 0)
            )
          },
          unit: "m²",
        }
      case "Windows":
        return {
          reducer: (acc, module) => {
            const moduleWindowTypes = getModuleWindowTypes(module)
            return (
              acc + moduleWindowTypes.reduce((acc, v) => acc + v.glazingArea, 0)
            )
          },
          unit: "m²",
        }
      case "Flashings":
        return {
          reducer: (acc, module) => acc + module.flashingArea,
          unit: "m²",
        }
      case "Guttering":
        return {
          reducer: (acc, module) => acc + module.gutterLength,
          unit: "m",
        }
      case "Downpipes":
        return {
          reducer: (acc, module) => acc + module.downpipeLength,
          unit: "m",
        }
      case "Pile footings":
      default:
        return { reducer: () => 0, unit: "" }
    }
  }

  const houseMaterialCalculator = (house: House) => {
    const houseModules = getHouseModules(house)
    return pipe(
      elements,
      A.filterMap(({ category, name: item }) => {
        const { reducer, unit } = getQuantityCalculator(item)

        try {
          const { specification, costPerUnit, embodiedCarbonPerUnit, linkUrl } =
            getElementMaterial(house.id, item)

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
          })
        } catch (e) {
          return O.none
        }
      })
    )
  }

  return selectedHouses.flatMap(houseMaterialCalculator)
}
