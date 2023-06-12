import { expose } from "comlink"
import { Group, Matrix4, Mesh, Object3D, ObjectLoader } from "three"
import { UpdateWorkerGroupEventDetail } from "."
import { GLTFExporter } from "./GLTFExporter"

function flattenObject(root: Object3D): Group {
  const flatGroup = new Group()

  root.traverse((child: Object3D) => {
    if (child instanceof Mesh && child.name.length > 0) {
      const newChild = child.clone()
      newChild.matrix.copy(child.matrixWorld)

      if (child.parent) {
        const parentInverse = child.parent.matrixWorld.invert()
        newChild.matrix.multiply(parentInverse)
      }

      newChild.position.setFromMatrixPosition(newChild.matrix)
      newChild.rotation.setFromRotationMatrix(newChild.matrix)
      newChild.scale.setFromMatrixScale(newChild.matrix)

      flatGroup.add(newChild)
    }
  })

  return flatGroup
}

const traverseJSON = (json: any, path = "") => {
  for (const key in json) {
    if (typeof json[key] === "object" && json[key] !== null) {
      // If the key is "rotation", log it
      if (key === "rotation") {
        // Check if any of the rotation values are NaN
        for (const rotKey in json[key]) {
          if (isNaN(json[key][rotKey])) {
            console.log(`NaN detected at ${path}${key}.${rotKey}`)
          }
        }
      }
      // Otherwise, continue traversing
      else {
        traverseJSON(json[key], path + key + ".")
      }
    }
  }
}

const OBJMap = new Map<string, string>()
const GLTFMap = new Map<string, any>()

const updateModels = async ({
  houseId,
  payload,
}: UpdateWorkerGroupEventDetail) => {
  const loader = new ObjectLoader()

  const parsed = loader.parse(payload)

  const flattened = flattenObject(parsed)

  const glbExporter = new GLTFExporter() as any

  glbExporter.parse(
    flattened,
    function (gltf: any) {
      GLTFMap.set(houseId, gltf)
    },
    function (e: any) {
      console.log(e)
    },
    { binary: false, onlyVisible: true }
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
