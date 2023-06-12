import { Remote, wrap } from "comlink"
import { useEffect, useRef } from "react"
import { useEvent } from "react-use"
import { ExportersWorkerAPI } from "./worker"

export const UPDATE_EXPORT_MODELS_EVENT = "UpdateExportModels"
export const GET_EXPORT_MODEL_EVENT = "GetExportModel"

export type UpdateWorkerGroupEventDetail = {
  houseId: string
  payload: any
}

export type UpdateWorkerGroupEvent = {
  type: typeof UPDATE_EXPORT_MODELS_EVENT
  detail: UpdateWorkerGroupEventDetail
}

export type GetModelEventDetail = {
  houseId: string
  format: "OBJ" | "GLB"
}

export type GetModelEvent = {
  type: typeof GET_EXPORT_MODEL_EVENT
  detail: GetModelEventDetail
}

export const dispatchUpdateExportModelsEvent = ({
  houseId,
  payload,
}: UpdateWorkerGroupEventDetail) => {
  dispatchEvent(
    new CustomEvent(UPDATE_EXPORT_MODELS_EVENT, {
      detail: { houseId, payload },
    })
  )
}

export const dispatchGetModelEvent = ({
  houseId,
  format,
}: GetModelEventDetail) => {
  dispatchEvent(
    new CustomEvent(GET_EXPORT_MODEL_EVENT, { detail: { houseId, format } })
  )
}

export const useOBJExporterWorker = () => {
  const ref = useRef<Remote<ExportersWorkerAPI> | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url))
    console.log(`worker setup`)
    ref.current = wrap<ExportersWorkerAPI>(worker)
  }, [])

  useEvent(
    UPDATE_EXPORT_MODELS_EVENT,
    ({ detail: { houseId, payload } }: UpdateWorkerGroupEvent) => {
      ref.current?.updateModels({ houseId, payload })
    }
  )

  useEvent(
    GET_EXPORT_MODEL_EVENT,
    async ({ detail: { houseId, format } }: GetModelEvent) => {
      switch (format) {
        case "GLB": {
          const gltfData = await ref.current?.getGLB(houseId)
          if (!gltfData) return

          const stringified = JSON.stringify(gltfData)

          const blob = new Blob([stringified], {
            type: "application/json",
          }) // Create a Blob from the OBJ data

          const url = URL.createObjectURL(blob) // Create a URL for the Blob

          // Create a download link and click it
          const link = document.createElement("a")
          link.href = url
          link.download = "model.gltf" // Set the file name
          link.style.display = "none"
          document.body.appendChild(link)
          link.click()

          // Cleanup
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          return
        }
        case "OBJ": {
          const objData = await ref.current?.getOBJ(houseId)
          if (!objData) return

          const blob = new Blob([objData], { type: "text/plain" }) // Create a Blob from the OBJ data
          const url = URL.createObjectURL(blob) // Create a URL for the Blob

          // Create a download link and click it
          const link = document.createElement("a")
          link.href = url
          link.download = "model.obj" // Set the file name
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
