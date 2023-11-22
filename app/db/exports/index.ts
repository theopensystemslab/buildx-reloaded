import Dexie from "dexie"
import {
  materialsListSub,
  orderListSub,
  type MaterialsListRow,
  type OrderListRow,
} from "./metrics"

class ExportsDatabase extends Dexie {
  orderListRows: Dexie.Table<OrderListRow, string>
  materialsListRows: Dexie.Table<MaterialsListRow, string>

  constructor() {
    super("UserDatabase")
    this.version(1).stores({
      houses: "houseId,&friendlyName",
      siteCtx: "&key, mode, houseId, levelIndex, projectName, region",
      orderListRows: "[houseId+blockName]",
      materialsListRows: "[houseId+item]",
    })
    this.orderListRows = this.table("orderListRows")
    this.materialsListRows = this.table("materialsListRows")
  }
}

const exportsDB = new ExportsDatabase()

export default exportsDB

export * from "./metrics"

orderListSub()
materialsListSub()
