import { useEvent } from "react-use"
import { getExportersWorker } from ".."
import houses from "../../design/state/houses"
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
      console.log({ payloadFront: payload })

      getExportersWorker().updateModels({
        houseId,
        payload: JSON.stringify(payload),
      })
    }
  )

  useEvent(
    GET_EXPORT_MODEL_EVENT,
    async ({ detail: { houseId, format } }: GetModelEvent) => {
      switch (format) {
        case "GLB": {
          const gltfData = await getExportersWorker().getGLB(houseId)
          if (!gltfData) return

          const blob = new Blob([gltfData], {
            type: "model/gltf-binary",
          })

          const url = URL.createObjectURL(blob)

          const link = document.createElement("a")
          link.href = url
          link.download = `${houses[houseId].friendlyName}.glb`
          link.style.display = "none"
          document.body.appendChild(link)
          link.click()

          // Cleanup
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          return
        }
        case "OBJ": {
          const objData = await getExportersWorker().getOBJ(houseId)
          if (!objData) return

          const blob = new Blob([objData], { type: "text/plain" })
          const url = URL.createObjectURL(blob)

          const link = document.createElement("a")
          link.href = url
          link.download = `${houses[houseId].friendlyName}.obj`
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
    }
  )
}
