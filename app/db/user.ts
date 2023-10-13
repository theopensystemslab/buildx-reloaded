import Dexie from "dexie"
import { useLiveQuery } from "dexie-react-hooks"
import { pipe } from "fp-ts/lib/function"
import { z } from "zod"
import { A, O, R } from "../utils/functions"
import { useAllModules } from "./systems"
import { useCallback } from "react"
import { SiteCtx } from "../design/state/siteCtx"

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

export const housesToRecord = (housesArray: House[]): Record<string, House> => {
  return pipe(
    housesArray,
    A.reduce({} as Record<string, House>, (acc, house) => ({
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

export const useHouses = () => {
  const houses: House[] = useLiveQuery(() => userDB.houses.toArray(), [], [])

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

class UserDatabase extends Dexie {
  houses: Dexie.Table<House, string>
  siteCtx: Dexie.Table<SiteCtx & { key: string }, string>

  constructor() {
    super("UserDatabase")
    this.version(1).stores({
      houses: "houseId,&friendlyName",
      siteCtx: "&key, mode, houseId, levelIndex, projectName, region",
    })
    this.houses = this.table("houses")
    this.siteCtx = this.table("siteCtx")
  }
}

const userDB = new UserDatabase()

export default userDB
