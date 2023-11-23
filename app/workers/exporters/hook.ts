import JSZip from "jszip"
import { useEffect, useState } from "react"
import { useEvent } from "react-use"
import { getExportersWorker } from ".."
import { useSelectedHouses } from "../../analyse/ui/HousesPillsSelector"
import userDB, { useHouse } from "../../db/user"
import exportsDB, { HouseModelsRow } from "../../db/exports"
import { pipe } from "fp-ts/lib/function"
import { O } from "../../utils/functions"
import { useLiveQuery } from "dexie-react-hooks"

export const useExportersWorker = () => {
  // useEvent(
  //   GET_EXPORT_MODEL_EVENT,
  //   async ({ detail: { houseId, format } }: GetModelEvent) => {
  //     userDB.houses.get(houseId).then(async (house) => {
  //       if (!house) return
  //       switch (format) {
  //         case "GLB": {
  //           const gltfData = await getExportersWorker().getGLB(houseId)
  //           if (!gltfData) return
  //           const blob = new Blob([gltfData], {
  //             type: "model/gltf-binary",
  //           })
  //           const url = URL.createObjectURL(blob)
  //           const link = document.createElement("a")
  //           link.href = url
  //           link.download = `${house.friendlyName}.glb`
  //           link.style.display = "none"
  //           document.body.appendChild(link)
  //           link.click()
  //           // Cleanup
  //           document.body.removeChild(link)
  //           URL.revokeObjectURL(url)
  //           return
  //         }
  //         case "OBJ": {
  //           const objData = await getExportersWorker().getOBJ(houseId)
  //           if (!objData) return
  //           const blob = new Blob([objData], { type: "text/plain" })
  //           const url = URL.createObjectURL(blob)
  //           const link = document.createElement("a")
  //           link.href = url
  //           link.download = `${house.friendlyName}.obj`
  //           link.style.display = "none"
  //           document.body.appendChild(link)
  //           link.click()
  //           // Cleanup
  //           document.body.removeChild(link)
  //           URL.revokeObjectURL(url)
  //           return
  //         }
  //         default:
  //           return
  //       }
  //     })
  //   }
  // )
}

export const useHousesModelRows = (houseIds: string[]) =>
  useLiveQuery(
    () => exportsDB.houseModels.where("houseId").anyOf(houseIds).toArray(),
    [houseIds],
    []
  )

export const useModelsZipURL = () => {
  const houses = useSelectedHouses()

  const [modelsDownloadUrl, setModelsDownloadUrl] = useState<
    string | undefined
  >(undefined)

  useEffect(() => {
    const zip = new JSZip()

    ;(async () => {
      if (houses.length < 1) return

      for (let { houseId, friendlyName } of houses) {
        const dbData = await exportsDB.houseModels.get(houseId)

        if (!dbData) continue

        const { glbData, objData } = dbData
        zip.file(
          `${friendlyName}.glb`,
          new Blob([glbData], { type: "model/gltf-binary" })
        )
        zip.file(
          `${friendlyName}.obj`,
          new Blob([objData], { type: "text/plain" })
        )
      }

      zip.generateAsync({ type: "blob" }).then(function (content) {
        // Create download link for the zip
        setModelsDownloadUrl(URL.createObjectURL(content))

        // const link = document.createElement("a")
        // link.href = url
        // link.download = "houses.zip"
        // document.body.appendChild(link)
        // link.click()

        // // Cleanup
        // document.body.removeChild(link)
        // URL.revokeObjectURL(url)
      })
    })()
  }, [houses])
  return modelsDownloadUrl
}
