import { expose } from "comlink"
import { Group, Matrix4, Mesh, Object3D, ObjectLoader } from "three"
import { UpdateWorkerGroupEventDetail } from "."
import { GLTFExporter } from "./GLTFExporter"

function flattenObject(root: Object3D): Group {
  // Create a new group for the flattened objects
  const flatGroup = new Group()

  // Create separate matrices for position and rotation
  const positionMatrix = new Matrix4().setPosition(root.position)
  const rotationMatrix = new Matrix4().makeRotationFromQuaternion(
    root.quaternion
  )

  // Invert them separately
  const positionInverter = positionMatrix.clone().invert()
  const rotationInverter = rotationMatrix.clone().invert()

  // Traverse all children in the hierarchy
  root.traverse((child: Object3D) => {
    // Check if the child is a mesh with a name
    if (child instanceof Mesh && child.name.length > 0) {
      // Clone the child so that we don't modify the original
      const newChild = child.clone()

      // Ensure the world matrix of the child is up-to-date
      child.updateMatrixWorld()

      // Copy the world matrix of the child to the clone
      newChild.matrix.copy(child.matrixWorld)

      // Apply the inverter matrices
      newChild.matrix.premultiply(positionInverter)
      newChild.matrix.premultiply(rotationInverter)

      // Decompose the matrix into position, quaternion, and scale
      newChild.matrix.decompose(
        newChild.position,
        newChild.quaternion,
        newChild.scale
      )

      // Reset the matrix of the clone to identity (not required if matrixAutoUpdate is true)
      newChild.matrix.identity()

      // Add the clone to the flattened group
      flatGroup.add(newChild)
    }
  })

  return flatGroup
}

const OBJMap = new Map<string, string>()
const GLTFMap = new Map<string, any>()

const updateModels = async ({
  houseId,
  payload,
}: UpdateWorkerGroupEventDetail) => {
  const loader = new ObjectLoader()

  const parsed = loader.parse(payload)

  parsed.updateMatrixWorld(true)

  const flattened = flattenObject(parsed)

  const glbExporter = new GLTFExporter() as any

  glbExporter.parse(
    flattened,
    function (gltf: any) {
      GLTFMap.set(houseId, gltf)
      console.log("new gltf")
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
