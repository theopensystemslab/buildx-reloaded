import { useLiveQuery } from "dexie-react-hooks"
import { flow, pipe } from "fp-ts/lib/function"
import JSZip from "jszip"
import { useEffect, useState } from "react"
import { useSelectedHouses } from "../../analyse/ui/HousesPillsSelector"
import outputsDB from "../../db/outputs"
import { A, TO } from "../../utils/functions"

export const useHousesModelRows = (houseIds: string[]) =>
  useLiveQuery(
    () => outputsDB.houseModels.where("houseId").anyOf(houseIds).toArray(),
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
          () => outputsDB.houseModels.get(houseId),
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
