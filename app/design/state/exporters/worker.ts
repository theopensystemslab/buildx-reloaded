import { expose } from "comlink"
import { ObjectLoader } from "three"
import { OBJExporter } from "three-stdlib"
import { ExportOBJEventDetail } from "."

const exportObj = async ({ houseId, payload }: ExportOBJEventDetail) => {
  console.log(`exportObj`)
  const exporter = new OBJExporter()
  const loader = new ObjectLoader()
  const group = loader.parse(payload) // payload should be the serialized Group
  const parsed = await exporter.parse(group)
  console.log({ parsed })
  return parsed
}

const api = {
  exportObj,
}

export type ExportersWorkerAPI = typeof api

expose(api)
