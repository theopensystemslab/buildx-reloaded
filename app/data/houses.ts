import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { BUILDX_LOCAL_STORAGE_HOUSES_KEY } from "~/design/state/constants"

export const houseParser = z.object({
  id: z.string().min(1),
  houseTypeId: z.string().min(1),
  systemId: z.string().min(1),
  dnas: z.array(z.string().min(1)),
  modifiedMaterials: z.record(z.string().min(1)),
  friendlyName: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  rotation: z.number(),
})

export type House = z.infer<typeof houseParser>

export const housesParser = z.record(houseParser)

export type Houses = z.infer<typeof housesParser>

export const getHousesFromLocalStorage = (): Houses => {
  try {
    return pipe(
      localStorage.getItem(BUILDX_LOCAL_STORAGE_HOUSES_KEY) ?? "{}",
      JSON.parse,
      housesParser.parse
    )
  } catch (err) {
    return {}
  }
}

export const saveHouses = (houses: Houses) => {
  localStorage.setItem(BUILDX_LOCAL_STORAGE_HOUSES_KEY, JSON.stringify(houses))
}