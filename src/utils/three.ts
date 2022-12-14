import { useGLTF as useGLTFDrei } from "@react-three/drei"
import { RootState } from "@react-three/fiber"
import { useCallback, useMemo, useRef } from "react"
import {
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Scene,
  Vector3,
} from "three"
import { CameraLayer, RaycasterLayer } from "../constants"
import { Material } from "../data/materials"
import dimensions, { getHouseCenter } from "../hooks/dimensions"
import houses from "../hooks/houses"

export type GltfT = {
  nodes: {
    [key: string]: Mesh | Group | Scene
  }
}

export const useGLTF = <T extends string | string[]>(path: T) =>
  useGLTFDrei(path, true, true) as unknown as T extends any[] ? GltfT[] : GltfT

export const isMesh = (x: Object3D): x is Mesh => x.type === "Mesh"

export const onCreated = (state: RootState) => {
  state.gl.localClippingEnabled = true
  state.raycaster.layers.disableAll()
  state.raycaster.layers.enable(CameraLayer.VISIBLE)
  state.raycaster.layers.enable(CameraLayer.INVISIBLE)
  state.raycaster.layers.enable(RaycasterLayer.ENABLED)
}

export const createMaterial = (config: Material) => {
  if (config.defaultColor) {
    return new MeshStandardMaterial({
      color: config.defaultColor,
      // transparent: true,
      emissive: "#000",
      // opacity: 0.6,
      // depthTest: false,
    })
  }

  // const textureLoader = new TextureLoader()

  // const setRepeat = (texture: Texture): void => {
  //   texture.wrapS = texture.wrapT = RepeatWrapping
  //   texture.repeat.set(10, 10)
  // }

  // const extractOrNullTextureMap = (url: string | undefined | null) =>
  //   url ? textureLoader.load(url, setRepeat) : null

  return new MeshStandardMaterial({
    color: 0xeeeeee,
    // map: extractOrNullTextureMap(config.textureUrl),
    // displacementMap: extractOrNullTextureMap(config.displacementUrl),
    // bumpMap: extractOrNullTextureMap(config.bumpUrl),
    // normalMap: extractOrNullTextureMap(config.normUrl),
    // aoMap: extractOrNullTextureMap(config.aoUrl),
    // roughnessMap: extractOrNullTextureMap(config.roughnessUrl),
    displacementScale: 0, // this can be used to 'explode' the components
    aoMapIntensity: 3.0,
    envMap: null,
    envMapIntensity: 1.5,
    lightMap: null,
    lightMapIntensity: 1,
    emissiveMap: null,
    emissive: 1,
    emissiveIntensity: 1,
    displacementBias: 1,
    roughness: 0.5,
    metalness: 0,
    alphaMap: null,
    bumpScale: 1,
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    clipIntersection: false,
    shadowSide: DoubleSide,
    clipShadows: true,
    clippingPlanes: [],
    wireframe: false,
    wireframeLinewidth: 1,
    flatShading: false,
    transparent: true,
  })
}

// obj - your object (THREE.Object3D or derived)
// point - the point of rotation (THREE.Vector3)
// axis - the axis of rotation (normalized THREE.Vector3)
// theta - radian value of rotation
// pointIsWorld - boolean indicating the point is in world coordinates (default = false)
export const rotateAboutPoint = (
  obj: Object3D,
  point: Vector3,
  axis: Vector3,
  theta: number
) => {
  obj.position.sub(point) // remove the offset
  obj.position.applyAxisAngle(axis, theta) // rotate the POSITION
  obj.position.add(point) // re-add the offset
  obj.rotateOnAxis(axis, theta) // rotate the OBJECT
}

export const useRotateAboutCenter = (houseId: string) => {
  const yAxis = useMemo(() => new Vector3(0, 1, 0), [])

  return useCallback(
    (obj: Object3D, theta: number, rotateOnAxis: boolean = true) => {
      const dims = dimensions[houseId]
      if (!dims) return

      const center = dims.obb.center
      obj.position.sub(center) // remove the offset
      obj.position.applyAxisAngle(yAxis, theta) // rotate the POSITION
      obj.position.add(center) // re-add the offset
      if (rotateOnAxis) obj.rotateOnAxis(yAxis, theta) // rotate the OBJECT
    },
    [houseId, yAxis]
  )
}

export const useSetRotation = (houseId: string) => {
  const yAxis = useMemo(() => new Vector3(0, 1, 0), [])
  const defaultCenter = useMemo(() => new Vector3(0, 0, 0), [])

  return useCallback(
    (obj: Object3D, theta: number, rotateOnAxis: boolean = true) => {
      const center = getHouseCenter(houseId)

      obj.position.sub(center)
      obj.position.applyAxisAngle(yAxis, theta)
      obj.position.add(center)

      if (rotateOnAxis) {
        obj.rotation.set(0, 0, 0)
        obj.rotateOnAxis(yAxis, theta) // rotate the OBJECT
      }
    },
    [houseId, yAxis]
  )
}

export const yAxis = new Vector3(0, 1, 0)

export const useRotations = () => {
  const rotationMatrix = useRef(new Matrix4())

  const unrotateV2 = useCallback(
    (houseId: string, [x0, z0]: [number, number]): [number, number] => {
      const vec = new Vector3(x0, 0, z0)
      rotationMatrix.current.makeRotationY(
        -houses?.[houseId ?? ""]?.rotation ?? 0
      )
      vec.applyMatrix4(rotationMatrix.current)
      const [x1, , z1] = vec.toArray()
      return [x1, z1]
    },
    []
  )

  const rotateV2 = useCallback(
    (houseId: string, [x0, z0]: [number, number]): [number, number] => {
      const vec = new Vector3(x0, 0, z0)
      rotationMatrix.current.makeRotationY(
        houses?.[houseId ?? ""]?.rotation ?? 0
      )
      vec.applyMatrix4(rotationMatrix.current)
      const [x1, , z1] = vec.toArray()
      return [x1, z1]
    },
    []
  )

  return { rotateV2, unrotateV2 }
}
