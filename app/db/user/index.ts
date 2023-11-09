import Dexie from "dexie"
import { SiteCtx } from "./siteCtx"
import { House } from "./houses"
import { MaterialsListRow, OrderListRow } from "./metrics"

class UserDatabase extends Dexie {
  houses: Dexie.Table<House, string>
  siteCtx: Dexie.Table<SiteCtx & { key: string }, string>
  orderListRows: Dexie.Table<OrderListRow, string>
  materialsListRows: Dexie.Table<MaterialsListRow, string>

  constructor() {
    super("UserDatabase")
    this.version(1).stores({
      houses: "houseId,&friendlyName",
      siteCtx: "&key, mode, houseId, levelIndex, projectName, region",
      orderListRows: "[houseId+blockName]",
      materialsListRows: "",
    })
    this.houses = this.table("houses")
    this.siteCtx = this.table("siteCtx")
    this.orderListRows = this.table("orderListRows")
    this.materialsListRows = this.table("materialsListRows")
  }
}

const userDB = new UserDatabase()

export default userDB

export * from "./siteCtx"
export * from "./houses"
export * from "./metrics"
