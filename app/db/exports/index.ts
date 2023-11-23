import Dexie from "dexie"
import {
  materialsListSub,
  orderListSub,
  type MaterialsListRow,
  type OrderListRow,
} from "./metrics"

type HouseModelsRow = {
  houseId: string
  glbData: any
  objData: any
}

class ExportsDatabase extends Dexie {
  orderListRows: Dexie.Table<OrderListRow, string>
  materialsListRows: Dexie.Table<MaterialsListRow, string>
  houseModels: Dexie.Table<HouseModelsRow, string>

  constructor() {
    super("ExportsDatabase")
    this.version(1).stores({
      orderListRows: "[houseId+blockName]",
      materialsListRows: "[houseId+item]",
      houseModels: "houseId",
    })
    this.orderListRows = this.table("orderListRows")
    this.materialsListRows = this.table("materialsListRows")
    this.houseModels = this.table("houseModels")
  }
}

const exportsDB = new ExportsDatabase()

export default exportsDB

export * from "./metrics"

orderListSub()
materialsListSub()
