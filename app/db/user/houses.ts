"use client"
import { useLiveQuery } from "dexie-react-hooks"
import { pipe } from "fp-ts/lib/function"
import { useCallback, useMemo } from "react"
import { z } from "zod"
import { A, O, R } from "../../utils/functions"
import { useAllModules } from "../systems"
import userDB from "."
import { useSiteCtx } from "../../design/state/siteCtx"

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

export const housesToRecord = <T extends House>(
  housesArray: T[]
): Record<string, T> => {
  return pipe(
    housesArray,
    A.reduce({} as Record<string, T>, (acc, house) => ({
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

export const useHouses = (): House[] => {
  const houses = useLiveQuery(() => userDB.houses.toArray(), [], [])

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

export const useBuildingHouse = (): House | null => {
  const houses = useHousesRecord()
  const { houseId } = useSiteCtx()

  return useMemo(() => {
    if (!houseId) return null
    return houses[houseId]
  }, [houseId, houses])
}

export const useBuildingHouseId = () => useBuildingHouse()?.houseId ?? null
