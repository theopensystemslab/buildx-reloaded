import { pipe } from "fp-ts/lib/function"
import { none, some } from "fp-ts/lib/Option"
import * as RA from "fp-ts/ReadonlyArray"
import produce from "immer"
import { useEffect } from "react"
import { proxy, subscribe, useSnapshot } from "valtio"
import { BUILDX_LOCAL_STORAGE_HOUSES_KEY } from "../constants"
import { getHousesFromLocalStorage, Houses } from "../data/house"
import { useAllHouseTypes } from "../data/houseType"
import { Module } from "../data/module"
import { useSystemModules } from "./modules"

const houses = proxy<Houses>(getHousesFromLocalStorage())

export const useLocallyStoredHouses = () =>
  useEffect(
    () =>
      subscribe(houses, () => {
        localStorage.setItem(
          BUILDX_LOCAL_STORAGE_HOUSES_KEY,
          JSON.stringify(houses)
        )
      }),
    []
  )

export const useHouses = () => {
  useLocallyStoredHouses()
  return useSnapshot(houses)
}

export const useHouse = (houseId: string) => {
  const housesSnap = useSnapshot(houses)
  return housesSnap[houseId]
}

export const useHouseType = (houseId: string) => {
  const house = useHouse(houseId)
  const { data } = useAllHouseTypes()
  const houseTypes = data ?? []
  const houseType = houseTypes.find((ht) => ht.id === house.houseTypeId)
  if (!houseType) throw new Error("houseType not found")
  return houseType
}

export const useHouseModules = (houseId: string) => {
  const { systemId } = useHouse(houseId)
  const systemModules = useSystemModules({ systemId })

  const house = useSnapshot(houses)[houseId]

  return pipe(
    house.dna,
    RA.filterMap((dna) =>
      pipe(
        systemModules,
        RA.findFirst(
          (systemModule: Module) =>
            systemModule.systemId === house.systemId && systemModule.dna === dna
        )
      )
    )
  )
}

export const modulesToRows = (
  modules: readonly Module[]
): readonly Module[][] => {
  const jumpIndices = pipe(
    modules,
    RA.filterMapWithIndex((i, m) =>
      m.structuredDna.positionType === "END" ? some(i) : none
    ),
    RA.filterWithIndex((i) => i % 2 === 0)
  )

  return pipe(
    modules,
    RA.reduceWithIndex(
      [],
      (moduleIndex, modules: Module[][], module: Module) => {
        return jumpIndices.includes(moduleIndex)
          ? [...modules, [{ ...module, moduleIndex }]]
          : produce(
              (draft) =>
                void draft[draft.length - 1].push({ ...module, moduleIndex })
            )(modules)
      }
    )
  )
}
export const useHouseRows = (buildingId: string) => {
  const houseModules = useHouseModules(buildingId)
  return modulesToRows(houseModules)
}

export default houses
