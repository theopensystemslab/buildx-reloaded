import { expose } from "comlink"
import { OBJExporter } from "three-stdlib"
import { UpdateOBJEventDetail } from "."
import { ObjectLoader } from "three"

const OBJMap = new Map<string, string>()

const updateOBJ = async ({ houseId, payload }: UpdateOBJEventDetail) => {
  console.log(`updateOBJ`)
  const exporter = new OBJExporter()
  const loader = new ObjectLoader()
  const group = loader.parse(payload)
  const OBJString = await exporter.parse(group)
  OBJMap.set(houseId, OBJString)
}

const getOBJ = (houseId: string) => {
  return OBJMap.get(houseId)
}

const api = {
  updateOBJ,
  getOBJ,
}

export type ExportersWorkerAPI = typeof api

expose(api)
