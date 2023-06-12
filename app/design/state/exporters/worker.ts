import { expose } from "comlink"
import { ObjectLoader } from "three"
import { UpdateWorkerGroupEventDetail } from "."
import { GLTFExporter } from "../../../utils/GLTFExporter"

const OBJMap = new Map<string, string>()
const GLTFMap = new Map<string, ArrayBuffer>()

const updateModels = async ({
  houseId,
  payload,
}: UpdateWorkerGroupEventDetail) => {
  const glbExporter = new GLTFExporter() as any
  const loader = new ObjectLoader()

  const root = loader.parse(payload)

  console.log(root)

  glbExporter.parse(
    root,
    function (gltf: ArrayBuffer) {
      console.log(gltf, typeof gltf)
      GLTFMap.set(houseId, gltf)
    },
    function (e: any) {
      console.log(e)
    },
    { binary: true }
  )
}

const getOBJ = (houseId: string) => {
  return OBJMap.get(houseId)
}

const getGLB = (houseId: string) => {
  return GLTFMap.get(houseId)
}

const api = {
  updateModels,
  getOBJ,
  getGLB,
}

export type ExportersWorkerAPI = typeof api

expose(api)
