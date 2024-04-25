import Dexie from "dexie"
import { type MaterialsListRow, type OrderListRow } from "./metrics"

export type HouseModelsRow = {
  houseId: string
  glbData: any
  objData: any
}

export type HousePngsRow = {
  houseId: string
  pngBlob: Blob
}

export const FILES_DOCUMENT_KEY = "FILES_DOCUMENT_KEY"

export type FilesDocument = {
  key: typeof FILES_DOCUMENT_KEY
  allFilesZip?: File
  orderListCsv?: File
  materialsListCsv?: File
  modelsZip?: File
}

class OutputsDatabase extends Dexie {
  orderListRows: Dexie.Table<OrderListRow, string>
  materialsListRows: Dexie.Table<MaterialsListRow, string>
  houseModels: Dexie.Table<HouseModelsRow, string>
  housePngs: Dexie.Table<HousePngsRow, string>
  files: Dexie.Table<FilesDocument, typeof FILES_DOCUMENT_KEY>

  constructor() {
    super("OutputsDatabase")

    this.version(1).stores({
      orderListRows: "[houseId+blockName]",
      materialsListRows: "[houseId+item]",
      houseModels: "houseId",
      housePngs: "houseId",
      files: "key",
    })

    this.orderListRows = this.table("orderListRows")
    this.materialsListRows = this.table("materialsListRows")
    this.houseModels = this.table("houseModels")
    this.housePngs = this.table("housePngs")
    this.files = this.table("files")
  }
}

const outputsDB = new OutputsDatabase()

outputsDB.files.toArray().then((xs) => {
  if (xs.length === 0) {
    outputsDB.files.put({ key: FILES_DOCUMENT_KEY })
  }
})

export const putHousePng = (houseId: string, pngBlob: Blob) =>
  outputsDB.housePngs.put({ houseId, pngBlob })

export default outputsDB

export * from "./metrics"
