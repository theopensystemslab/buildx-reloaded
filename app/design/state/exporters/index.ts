import { Remote, wrap } from "comlink"
import { useEffect, useRef } from "react"
import { useEvent } from "react-use"
import { ExportersWorkerAPI } from "./worker"

export const UPDATE_OBJ_EVENT = "UpdateOBJ"
export const GET_OBJ_EVENT = "GetOBJ"

export type UpdateOBJEventDetail = {
  houseId: string
  payload: any
}

export type GetOBJEventDetail = {
  houseId: string
}

export type UpdateOBJEvent = {
  type: typeof UPDATE_OBJ_EVENT
  detail: UpdateOBJEventDetail
}

export type GetOBJEvent = {
  type: typeof GET_OBJ_EVENT
  detail: GetOBJEventDetail
}

export const dispatchUpdateOBJEvent = ({
  houseId,
  payload,
}: UpdateOBJEventDetail) => {
  console.log({ payload })
  dispatchEvent(
    new CustomEvent(UPDATE_OBJ_EVENT, {
      detail: { houseId, payload },
    })
  )
}

export const dispatchGetOBJEvent = ({ houseId }: GetOBJEventDetail) => {
  dispatchEvent(new CustomEvent(GET_OBJ_EVENT, { detail: { houseId } }))
}

export const useOBJExporterWorker = () => {
  const ref = useRef<Remote<ExportersWorkerAPI> | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url))
    console.log(`worker setup`)
    ref.current = wrap<ExportersWorkerAPI>(worker)
  }, [])

  useEvent(
    UPDATE_OBJ_EVENT,
    ({ detail: { houseId, payload } }: UpdateOBJEvent) => {
      ref.current?.updateOBJ({ houseId, payload })
    }
  )

  useEvent(GET_OBJ_EVENT, async ({ detail: { houseId } }: GetOBJEvent) => {
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
  })
}
