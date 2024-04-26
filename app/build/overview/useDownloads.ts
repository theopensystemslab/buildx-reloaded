import { useLiveQuery } from "dexie-react-hooks"
import outputsDB, { FILES_DOCUMENT_KEY, FilesDocument } from "~/db/outputs"

const useDownloads = (): {
  allFilesZipURL: string | null
  modelsZipURL: string | null
  materialsListCsvURL: string | null
  orderListCsvURL: string | null
} => {
  const {
    allFilesZip,
    materialsListCsv,
    modelsZip,
    orderListCsv,
  }: FilesDocument = useLiveQuery(
    () => outputsDB.files.get(FILES_DOCUMENT_KEY),
    [],
    { key: FILES_DOCUMENT_KEY }
  ) as FilesDocument

  let allFilesZipURL = null,
    modelsZipURL = null,
    materialsListCsvURL = null,
    orderListCsvURL = null

  /* URLs are only created when the relevant blob is non-null */
  if (allFilesZip) {
    allFilesZipURL = URL.createObjectURL(allFilesZip)
  }
  if (modelsZip) {
    modelsZipURL = URL.createObjectURL(modelsZip)
  }
  if (materialsListCsv) {
    materialsListCsvURL = URL.createObjectURL(materialsListCsv)
  }
  if (orderListCsv) {
    orderListCsvURL = URL.createObjectURL(orderListCsv)
  }

  return {
    allFilesZipURL,
    materialsListCsvURL,
    modelsZipURL,
    orderListCsvURL,
  }
}

export default useDownloads
