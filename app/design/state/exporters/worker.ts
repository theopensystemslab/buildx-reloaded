import { expose } from "comlink"
import { Group, Mesh, Object3D, ObjectLoader } from "three"
import { UpdateWorkerGroupEventDetail } from "."
import { GLTFExporter } from "./GLTFExporter"

// function flattenObject(root: Object3D): Group {
//   const flatGroup = new Group()

//   const inverter = root.matrixWorld.clone().invert()

//   root.traverse((child: Object3D) => {
//     if (child instanceof Mesh && child.name.length > 0) {
//       child.updateMatrixWorld()
//       // console.log(child.matrixWorld)
//       const newChild = child.clone()
//       newChild.matrix.copy(child.matrixWorld)
//       newChild.updateMatrix()
//       // newChild.matrix.multiply(inverter)
//       // newChild.position.setFromMatrixPosition(newChild.matrix)
//       // newChild.rotation.setFromRotationMatrix(newChild.matrix)
//       // newChild.scale.setFromMatrixScale(newChild.matrix)
//       flatGroup.add(newChild)
//     }
//   })

//   return flatGroup
// }

function flattenObject(root: Object3D): Group {
  // Create a new group for the flattened objects
  const flatGroup = new Group()

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
