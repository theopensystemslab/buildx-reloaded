import JSZip from "jszip"
import { useEffect, useState } from "react"
import { useEvent } from "react-use"
import { getExportersWorker } from ".."
import { useSelectedHouses } from "../../analyse/ui/HousesPillsSelector"
import userDB from "../../db/user"

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

export const useModelsDownloadUrl = () => {
  const houses = useSelectedHouses()

  const [modelsDownloadUrl, setModelsDownloadUrl] = useState<
    string | undefined
  >(undefined)

  useEffect(() => {
    const zip = new JSZip()

    ;(async () => {
      for (let house of houses) {
        // Promise.all()
        const glbData = await getExportersWorker().getGLB(house.houseId)
        if (glbData) {
          const blob = new Blob([glbData], { type: "model/gltf-binary" })
          zip.file(`${house.friendlyName}.glb`, blob)
        }
        const objData = await getExportersWorker().getOBJ(house.houseId)
        if (objData) {
          const blob = new Blob([objData], { type: "text/plain" })
          zip.file(`${house.friendlyName}.obj`, blob)
        }
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
