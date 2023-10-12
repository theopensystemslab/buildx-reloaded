import { useEvent } from "react-use"
import { getExportersWorker } from ".."
import userDB from "../../db/user"
import {
  GET_EXPORT_MODEL_EVENT,
  GetModelEvent,
  UPDATE_EXPORT_MODELS_EVENT,
  UpdateWorkerGroupEvent,
} from "./events"

export const useExportersWorker = () => {
  useEvent(
    UPDATE_EXPORT_MODELS_EVENT,
    ({ detail: { houseId, payload } }: UpdateWorkerGroupEvent) => {
      getExportersWorker().updateModels({
        houseId,
        payload,
      })
    }
  )

  useEvent(
    GET_EXPORT_MODEL_EVENT,
    async ({ detail: { houseId, format } }: GetModelEvent) => {
      userDB.houses.get(houseId).then(async (house) => {
        if (!house) return

        switch (format) {
          case "GLB": {
            const gltfData = await getExportersWorker().getGLB(houseId)

            if (!gltfData) return

            console.log(gltfData)

            const blob = new Blob([gltfData], {
              type: "model/gltf-binary",
            })

            const url = URL.createObjectURL(blob)

            const link = document.createElement("a")
            link.href = url
            link.download = `${house.friendlyName}.glb`
            link.style.display = "none"
            document.body.appendChild(link)
            link.click()

            // Cleanup
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            return
          }
          case "OBJ": {
            console.log(`getting obj`)
            const objData = await getExportersWorker().getOBJ(houseId)

            console.log({ objData })

            if (!objData) return

            const blob = new Blob([objData], { type: "text/plain" })
            const url = URL.createObjectURL(blob)

            const link = document.createElement("a")
            link.href = url
            link.download = `${house.friendlyName}.obj`
            link.style.display = "none"
            document.body.appendChild(link)
            link.click()

            // Cleanup
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            return
          }
          default:
            return
        }
      })
    }
  )
}
