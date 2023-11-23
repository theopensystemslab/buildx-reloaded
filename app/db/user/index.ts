import Dexie from "dexie"
import { SiteCtx } from "../../design/state/siteCtx"
import { House } from "./houses"

class UserDatabase extends Dexie {
  houses: Dexie.Table<House, string>
  siteCtx: Dexie.Table<SiteCtx & { key: string }, string>

  constructor() {
    super("UserDatabase")
    this.version(1).stores({
      houses: "houseId,&friendlyName",
      siteCtx: "&key, mode, houseId, levelIndex, projectName, region",
      orderListRows: "[houseId+blockName]",
      materialsListRows: "[houseId+item]",
    })
    this.houses = this.table("houses")
    this.siteCtx = this.table("siteCtx")
  }
}

const userDB = new UserDatabase()

export default userDB

export * from "./houses"
