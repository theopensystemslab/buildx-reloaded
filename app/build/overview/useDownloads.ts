import { useOutputsFiles } from "@opensystemslab/buildx-core"

const useDownloads = (): {
  allFilesZipURL: string | null
  modelsZipURL: string | null
  materialsListCsvURL: string | null
  orderListCsvURL: string | null
} => {
  const { allFilesZip, materialsListCsv, modelsZip, orderListCsv } =
    useOutputsFiles()

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
