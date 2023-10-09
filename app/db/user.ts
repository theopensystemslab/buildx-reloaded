import Dexie from "dexie"
import { useLiveQuery } from "dexie-react-hooks"
import { pipe } from "fp-ts/lib/function"
import { z } from "zod"
import { A, O, R } from "../utils/functions"
import { useAllModules } from "./systems"

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

  const currentNames = pipe(
    houses,
    A.map((x) => x.friendlyName)
  )
  const findUniqueName = (name: string, existingNames: string[]): string => {
    let uniqueName = name
    let counter = 1

    while (existingNames.includes(uniqueName)) {
      uniqueName = `${name} ${counter}`
      counter++
    }

    return uniqueName
  }

  return () => {
    const baseName = "Building"
    const newName = findUniqueName(baseName, currentNames)
    return newName
  }
}

class UserDatabase extends Dexie {
  houses: Dexie.Table<House, string>

  constructor() {
    super("UserDatabase")
    this.version(1).stores({
      houses: "houseId,&friendlyName",
    })
    this.houses = this.table("houses")
  }
}

const userDB = new UserDatabase()

export default userDB
