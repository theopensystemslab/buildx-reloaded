import { trpc } from "@/client/trpc"
import { findFirst } from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import { BufferGeometry } from "three"
import { A, O, R, RA, S } from "~/utils/functions"
import { Element } from "../../server/data/elements"
import { Module } from "../../server/data/modules"
import { useSelectedHouses } from "../analyse/ui/HousesPillsSelector"
import { useGetElementMaterial } from "../design/state/hashedMaterials"
import { useGetHouseModules } from "../design/state/houses"
import useSpeckleObject from "../utils/speckle/useSpeckleObject"
import { House } from "./houses"
import { useMaterials } from "./materials"
import { useModules } from "./modules"
import { useWindowTypes } from "./windowTypes"

export const useElements = (): Element[] => {
  const { data = [] } = trpc.elements.useQuery()
  return data
}

export const useSystemElements = ({
  systemId,
}: {
  systemId: string
}): Element[] => {
  return useElements().filter((x) => x.systemId === systemId)
}

export const useIfcTagToElement = (systemId: string) => {
  const elements = useSystemElements({ systemId })

  return (ifcTag: string) => {
    const result = pipe(
      elements,
      RA.findFirst((el) => {
        return el.ifc4Variable.toUpperCase() === ifcTag
      }),
      O.toUndefined
    )

    if (result === undefined) {
      console.log({
        unmatchedIfcTag: { ifcTag },
      })
    }

    return result
  }
}

export const getModuleElementGeometriesKey = ({
  systemId,
  dna,
}: {
  systemId: string
  dna: string
}) => `${systemId}:${dna}`

export const invertModuleElementGeometriesKey = (input: string) => {
  const [systemId, dna] = input.split(":")
  return { systemId, dna }
}

export const useModuleElements = ({
  systemId,
  speckleBranchUrl,
}: Module): Record<string, BufferGeometry> => {
  const ifcTagToElement = useIfcTagToElement(systemId)
  const speckleObject = useSpeckleObject(speckleBranchUrl)

  return useMemo(
    () =>
      pipe(
        speckleObject,
        R.reduceWithIndex(S.Ord)({}, (ifcTag, acc, geometry) => {
          const el = ifcTagToElement(ifcTag)
          if (!el) return acc
          return {
            ...acc,
            [el.name]: geometry,
          }
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speckleBranchUrl]
  )
}

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

export const useHouseElementMaterialCalculations = () => {
  const selectedHouses = useSelectedHouses()
  const modules = useModules()
  const windowTypes = useWindowTypes()
  const materials = useMaterials()
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
      case "Windows":
        return {
          reducer: (acc, module) => {
            const {
              windowTypeEnd,
              windowTypeSide1,
              windowTypeSide2,
              windowTypeTop,
            } = module.structuredDna
            return acc
          },
          unit: "m²",
        }
      case "In-situ concrete":
        return {
          reducer: (acc, module) => acc,
          unit: "m3",
        }
      case "Pile footings":
      default:
        return { reducer: () => 0, unit: "" }
    }
  }

  const houseMaterialCalculator = (house: House) => {
    const houseModules = getHouseModules(house)
    pipe(
      elements,
      A.map(({ category, name: item }) => {
        const { reducer, unit } = getQuantityCalculator(item)

        return {
          buildingName: house.friendlyName,
          item,
          category,
          specification: getElementMaterial(house.id, item),
          quantity: {
            value: pipe(houseModules, A.reduce(0, reducer)),
            unit,
          },
        }
      })
    )
  }

  return pipe(selectedHouses, A.map(houseMaterialCalculator))
}
