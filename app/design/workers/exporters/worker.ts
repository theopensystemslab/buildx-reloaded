import { expose } from "comlink"
import { Group, Matrix4, Mesh, Object3D, ObjectLoader } from "three"
import { GLTFExporter, OBJExporter } from "three-stdlib"
import { UpdateWorkerGroupEventDetail } from "."

function flattenObject(root: Object3D): Group {
  const flatGroup = new Group()

  const positionMatrix = new Matrix4().setPosition(root.position)
  const rotationMatrix = new Matrix4().makeRotationFromQuaternion(
    root.quaternion
  )

  const positionInverter = positionMatrix.clone().invert()
  const rotationInverter = rotationMatrix.clone().invert()

  const skipObject = (object: Object3D): boolean =>
    !(object instanceof Mesh) ||
    object.userData?.identifier?.identifierType !== "HOUSE_ELEMENT"

  root.traverse((child: Object3D) => {
    if (!skipObject(child)) {
      const newChild = child.clone()

      child.updateMatrixWorld()

      newChild.matrix.copy(child.matrixWorld)

      newChild.matrix.premultiply(positionInverter)
      newChild.matrix.premultiply(rotationInverter)

      newChild.matrix.decompose(
        newChild.position,
        newChild.quaternion,
        newChild.scale
      )

      newChild.matrix.identity()

      flatGroup.add(newChild)
    }
  })

  return flatGroup
}

const OBJMap = new Map<string, string>()
const GLTFMap = new Map<string, any>()

const parseAndSetGLTF = (houseId: string, object: Object3D) => {
  const gltfExporter = new GLTFExporter() as any

  gltfExporter.parse(
    object,
    function (gltf: any) {
      GLTFMap.set(houseId, gltf)
    },
    function (e: any) {
      console.error(e)
    },
    { binary: true, onlyVisible: true }
  )
}

const parseAndSetOBJ = (houseId: string, object: Object3D) => {
  const objExporter = new OBJExporter()
  const parsedObj = objExporter.parse(object)
  OBJMap.set(houseId, parsedObj)
}

const updateModels = async ({
  houseId,
  payload,
}: UpdateWorkerGroupEventDetail) => {
  const loader = new ObjectLoader()
  const parsed = loader.parse(payload)
  parsed.updateMatrixWorld(true)

  const flattened = flattenObject(parsed)

  parseAndSetGLTF(houseId, flattened)
  parseAndSetOBJ(houseId, flattened)
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
