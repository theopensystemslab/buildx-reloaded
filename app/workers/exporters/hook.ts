import JSZip from "jszip"
import { useEffect, useState } from "react"
import { useEvent } from "react-use"
import { getExportersWorker } from ".."
import { useSelectedHouses } from "../../analyse/ui/HousesPillsSelector"
import userDB, { useHouse } from "../../db/user"
import exportsDB, { HouseModelsRow } from "../../db/exports"
import { flow, pipe } from "fp-ts/lib/function"
import { A, O, T, TO } from "../../utils/functions"
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

export const useSelectedHouseModelBlobs = () => {
  const houses = useSelectedHouses()

  const [blobs, setBlobs] = useState<[string, Blob][]>([])

  useEffect(() => {
    pipe(
      houses,
      A.traverse(TO.ApplicativePar)(({ houseId, friendlyName }) =>
        pipe(
          () => exportsDB.houseModels.get(houseId),
          TO.fromTask,
          TO.chain(
            flow(
              TO.fromNullable,
              TO.map(({ glbData, objData }): [string, Blob][] => [
                [
                  `${friendlyName}.glb`,
                  new Blob([glbData], { type: "model/gltf-binary" }),
                ],

                [
                  `${friendlyName}.obj`,
                  new Blob([objData], { type: "text/plain" }),
                ],
              ])
            )
          )
        )
      ),
      TO.map(flow(A.flatten, setBlobs))
    )()
  }, [houses])

  return blobs
}

export const useModelsZipURL = () => {
  const modelBlobs = useSelectedHouseModelBlobs()

  const [modelsDownloadUrl, setModelsDownloadUrl] = useState<
    string | undefined
  >(undefined)

  useEffect(() => {
    const zip = new JSZip()

    for (let [filename, blob] of modelBlobs) {
      zip.file(filename, blob)
    }

    zip.generateAsync({ type: "blob" }).then(function (content) {
      setModelsDownloadUrl(URL.createObjectURL(content))
    })
  }, [modelBlobs])

  return modelsDownloadUrl
}
