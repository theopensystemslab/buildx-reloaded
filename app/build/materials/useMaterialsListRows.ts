import { Module, useGetModuleWindowTypes } from "@/server/data/modules"
import { pipe } from "fp-ts/lib/function"
import { useCallback, useMemo, useRef } from "react"
import {
  buildingColorVariants,
  useGetColorClass,
  useSelectedHouseIds,
} from "~/analyse/ui/HousesPillsSelector"
import { A, O } from "~/utils/functions"
import { useAllElements } from "../../db/systems"
import { MaterialsListRow, useGetHouseModules, useHouses } from "../../db/user"
import {
  ElementNotFoundError,
  MaterialNotFoundError,
  useGetElementMaterial,
} from "../../design/ui-3d/fresh/systems"
import { useOrderListData } from "../order/useOrderListData"

export const useMaterialsListRows = () => {
  const selectedHouseIds = useSelectedHouseIds()

  const getModuleWindowTypes = useGetModuleWindowTypes()
  const elements = useAllElements()
  const getElementMaterial = useGetElementMaterial()

  const houses = useHouses()

  const selectedHouses = useMemo(
    () =>
      pipe(
        houses,
        A.filter((x) => selectedHouseIds.includes(x.houseId))
      ),
    [houses, selectedHouseIds]
  )

  const getHouse = useCallback(
    (houseId: string) =>
      pipe(
        selectedHouses,
        A.findFirst((x) => x.houseId === houseId)
      ),
    [selectedHouses]
  )

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
          return (acc, module) => 0
      }
    },
    [getModuleWindowTypes]
  )

  const { blockCountsByHouse } = useOrderListData(selectedHouses)

  let categories = useRef<string[]>([])

  const getCategoryColorClass = useCallback((category: string): string => {
    const index = categories.current.indexOf(category)
    const maxIndex = Object.keys(buildingColorVariants).length
    const reversedIndex = (maxIndex - 2 - index + maxIndex) % maxIndex
    return buildingColorVariants[reversedIndex]
  }, [])

  const houseMaterialCalculator = useCallback(
    (houseId: string): MaterialsListRow[] => {
      const house = getHouse(houseId)

      if (O.isNone(house)) return []

      const houseModules = getHouseModules(houseId)

      const elementRows: MaterialsListRow[] = pipe(
        elements,
        A.filterMap(({ category, name: item }) => {
          if (["Insulation"].includes(item)) return O.none

          if (!categories.current.includes(category))
            categories.current.push(category)

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
              buildingName: house.value.friendlyName,
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
          buildingName: house.value.friendlyName,
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
    },
    [
      blockCountsByHouse,
      elements,
      getElementMaterial,
      getHouse,
      getHouseModules,
      getQuantityReducer,
    ]
  )

  return useMemo(() => {
    return selectedHouseIds.flatMap(houseMaterialCalculator)
  }, [selectedHouseIds, houseMaterialCalculator])
}
