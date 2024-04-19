import Dexie from "dexie"
import {
  materialsListSub,
  orderListSub,
  type MaterialsListRow,
  type OrderListRow,
} from "./metrics"

export type HouseModelsRow = {
  houseId: string
  glbData: any
  objData: any
}

// export type HousePngsRow = {
//   houseId: string
//   pngBlob: Blob
// }

// export type HouseFiles = {
//   houseId: string
//   glb: File
//   obj: File
//   png: File
//   orderListCsv: File
//   materialsListCsv: File
// }

// export type ProjectFiles = {
//   projectName: string
//   orderListCsv: File
//   materialsListCsv: File
//   allFilesZip: File
//   modelsZip: File
// }

class OutputsDatabase extends Dexie {
  orderListRows: Dexie.Table<OrderListRow, string>
  materialsListRows: Dexie.Table<MaterialsListRow, string>
  // houseFiles: Dexie.Table<HouseFiles, string>
  // projectFiles: Dexie.Table<ProjectFiles, string>

  constructor() {
    super("OutputsDatabase")

    this.version(1).stores({
      orderListRows: "[houseId+blockName]",
      materialsListRows: "[houseId+item]",
      // houseFiles: "houseId",
      // projectFiles: "projectName",
    })

    this.orderListRows = this.table("orderListRows")
    this.materialsListRows = this.table("materialsListRows")
    // this.houseFiles = this.table("houseFiles")
    // this.projectFiles = this.table("projectFiles")
  }
}

const outputsDB = new OutputsDatabase()

export default outputsDB

export * from "./metrics"
