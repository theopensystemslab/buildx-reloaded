import { Module } from "@/server/data/modules"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import { none, some } from "fp-ts/lib/Option"
import { keys } from "fp-ts/lib/ReadonlyRecord"
import produce from "immer"
import { nanoid } from "nanoid"
import { useMemo } from "react"
import { useKey } from "react-use"
import { Vector3 } from "three"
import { proxy, snapshot, subscribe, useSnapshot } from "valtio"
import { A, clearRecord, R, RA, RR, S } from "~/utils/functions"
import { useHouseTypes } from "../../data/houseTypes"
import { useModules, useSystemModules } from "../../data/modules"
import userDB, { House } from "../../db/user"
import { isSSR } from "../../utils/next"

const houses = proxy<Record<string, House>>({})

const initHouses = async () => {
  if (isSSR()) return

  const housesArray = await userDB.houses.toArray()
  if (!A.isNonEmpty(housesArray)) {
    clearRecord(houses)
  }

  housesArray.forEach((house) => {
    houses[house.id] = house
  })
}

initHouses().then(() => {
  subscribe(houses, () => {
    // This will run every time `houses` changes
    Object.values(houses).forEach(async (house) => {
      const snapshotHouse = snapshot(house) as typeof house
      // Check if house exists in the DB
      const existingHouse = await userDB.houses.get(house.id)
      if (existingHouse) {
        // If it exists, update it
        userDB.houses.update(house.id, snapshotHouse)
      } else {
        // If it doesn't exist, add it
        userDB.houses.add(snapshotHouse)
      }
    })
  })
})

export const useHouses = () => {
  return useSnapshot(houses) as typeof houses
}

export const useHouseKeys = () => {
  return pipe(useSnapshot(houses) as typeof houses, RR.keys)
}

export const useHouse = (houseId: string) => {
  const housesSnap = useSnapshot(houses) as typeof houses
  return housesSnap[houseId]
}

export const useHouseType = (houseId: string) => {
  const house = useHouse(houseId)
  const houseTypes = useHouseTypes()
  const houseType = houseTypes.find((ht) => ht.id === house.houseTypeId)
  if (!houseType) throw new Error("houseType not found")
  return houseType
}

export const useHouseModules = (houseId: string) => {
  const { systemId, dnas: dna } = useHouse(houseId)
  const systemModules = useSystemModules({ systemId })

  return useMemo(
    () =>
      pipe(
        dna,
        A.filterMap((dna) =>
          pipe(
            systemModules,
            RA.findFirst(
              (systemModule: Module) =>
                systemModule.systemId === systemId && systemModule.dna === dna
            )
          )
        )
      ),
    [dna, systemId, systemModules]
  )
}

export const useDnasModules = (systemId: string, dnas: string[]) => {
  const systemModules = useSystemModules({ systemId })

  return useMemo(
    () =>
      pipe(
        dnas,
        A.filterMap((dna) =>
          pipe(
            systemModules,
            RA.findFirst(
              (systemModule: Module) =>
                systemModule.systemId === systemId && systemModule.dna === dna
            )
          )
        )
      ),
    [dnas, systemId, systemModules]
  )
}

export const useGetHouseModules = () => {
  const allSystemModules = useModules()

  return ({ systemId, dnas }: { systemId: string; dnas: string[] }) => {
    let modules: Module[] = []

    for (let dna of dnas) {
      const foundModule = allSystemModules.find(
        (module) => module.systemId === systemId && module.dna === dna
      )
      if (!foundModule) continue

      modules.push(foundModule)
    }
    return modules
  }
}

export const useHousesSystems = () => {
  const snap = useSnapshot(houses) as typeof houses
  return pipe(
    snap,
    RR.reduce(S.Ord)([], (acc: string[], { systemId }) => {
      return A.uniq(S.Eq)([...acc, systemId])
    })
  )
}

export const useSystemHouses = (systemId: string): House[] => {
  const snap = useSnapshot(houses) as typeof houses

  return pipe(
    snap,
    R.filter((v) => v.systemId === systemId),
    values
  )
}

export const useSystemUniqueDnas = (systemId: string): string[] => {
  const systemHouses = useSystemHouses(systemId)
  return pipe(
    systemHouses,
    A.reduce([], (acc: string[], { dnas: dna }) =>
      A.uniq(S.Eq)([...acc, ...dna])
    )
  )
}

export const useInsert1000Skylarks = () => {
  const houseTypes = useHouseTypes()

  useKey(
    "x",
    () => {
      // const position = cameraGroundRaycast() ?? [0, 0, 0]
      const houseTypeId = "recSARkreiK3KMoTi"

      const houseType = houseTypes?.find((x) => x.id === houseTypeId)
      if (!houseType) throw new Error("skylark not found")

      const count = 11,
        incX = 7,
        incZ = 3,
        startX = -(incX * count) / 2,
        startZ = -(incZ * count) / 2

      for (let x = startX; x < incX * count; x += incX) {
        for (let z = startZ; z < incZ * count; z += incZ) {
          const id = nanoid()
          houses[id] = {
            id,
            houseTypeId,
            systemId: houseType.systemId,
            position: new Vector3(x, 0, z),
            rotation: 0,
            dnas: houseType.dnas as string[],
            modifiedMaterials: {},
            friendlyName: `Building ${keys(houses).length + 1}`,
          }
        }
      }
    },
    undefined,
    [houseTypes]
  )
}

export const useHouseSystemId = (houseId: string) => {
  const houses = useHouses()
  const { systemId } = houses[houseId]
  return systemId
}

export default houses
