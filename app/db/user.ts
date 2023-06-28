import Dexie from "dexie"
import { z } from "zod"

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

class UserDatabase extends Dexie {
  houses: Dexie.Table<House, string>

  constructor() {
    super("UserDatabase")
    this.version(1).stores({
      houses: "id,&friendlyName",
    })
    this.houses = this.table("houses")
  }
}

const userDB = new UserDatabase()

export default userDB
