import { Remote, wrap } from "comlink"
import { useEffect, useRef } from "react"
import { useEvent } from "react-use"
import { ExportersWorkerAPI } from "./worker"

export const EXPORT_OBJ_EVENT = "ExportOBJ"

export type ExportOBJEventDetail = {
  houseId: string
  payload: any
}

export type ExportOBJEvent = {
  type: typeof EXPORT_OBJ_EVENT
  detail: ExportOBJEventDetail
}

export const dispatchExportOBJEvent = ({
  houseId,
  payload,
}: ExportOBJEventDetail) => {
  console.log({ payload })
  dispatchEvent(
    new CustomEvent(EXPORT_OBJ_EVENT, {
      detail: { houseId, payload },
    })
  )
}

export const useExportOBJEvents = () => {
  const ref = useRef<Remote<ExportersWorkerAPI> | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url))
    console.log(`worker setup`)
    ref.current = wrap<ExportersWorkerAPI>(worker)
  }, [])

  useEvent(
    EXPORT_OBJ_EVENT,
    ({ detail: { houseId, payload } }: ExportOBJEvent) => {
      console.log(`exporting obj`)
      const foo = ref.current?.exportObj({ houseId, payload })
      console.log({ foo })
    }
  )
}
