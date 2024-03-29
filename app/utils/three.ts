"use client"
import { useGLTF as useGLTFDrei } from "@react-three/drei"
import { RootState } from "@react-three/fiber"
import { useCallback, useRef } from "react"
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Scene,
  Vector3,
} from "three"
import { Material } from "../../server/data/materials"
import { CameraLayer, RaycasterLayer } from "../design/state/constants"
// import dimensions, { getHouseCenter } from "../design/state/dimensions"

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
  state.raycaster.layers.set(RaycasterLayer.ENABLED)
  state.gl.outputColorSpace = SRGBColorSpace
}

export const createThreeMaterial = (material: Material) => {
  if (material.specification === "Glass") {
    return new MeshPhysicalMaterial({
      // -- thickness of the clear coat layer, from 0.0 to 1.0
      clearcoat: 0.1,
      // -- Index-of-refraction for non-metallic materials, from 1.0 to 2.333. Default is 1.5.
      ior: 0.5,
      // -- Degree of reflectivity, from 0.0 to 1.0. Default is 0.5, which corresponds to an index-of-refraction of 1.5
      reflectivity: 0.5,
      // -- Degree of transmission (or optical transparency), from 0.0 to 1.0. Default is 0.0.
      // Thin, transparent or semitransparent, plastic or glass materials remain largely reflective even if they are fully transmissive. The transmission property can be used to model these materials.
      // When transmission is non-zero, opacity should be set to 1.
      transmission: 0.5,

      // #ebf1fa
      color: material.defaultColor,
      // color: "clear",
      metalness: 0,
      roughness: 0,
      alphaTest: 0.5,
      // envMap: hdrCubeRenderTarget.texture,
      // envMapIntensity: params.envMapIntensity,
      depthWrite: false,
      opacity: 1, // set material.opacity to 1 when material.transmission is non-zero
      transparent: true,
      clipShadows: true,
    })
  }

  if (material.defaultColor) {
    return new MeshStandardMaterial({
      color: material.defaultColor,
      // transparent: true,
      emissive: "#000",
      side: DoubleSide,
      // shadowSide: DoubleSide,
      // wireframe: true,
      // opacity: 0.6,
      // depthTest: false,
      clipShadows: true,
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

export const xAxis = new Vector3(1, 0, 0)
export const yAxis = new Vector3(0, 1, 0)
export const zAxis = new Vector3(0, 0, 1)

// export const useRotations = () => {
//   const rotationMatrix = useRef(new Matrix4())

//   const unrotateV2 = useCallback(
//     (houseId: string, [x0, z0]: [number, number]): [number, number] => {
//       const vec = new Vector3(x0, 0, z0)
//       rotationMatrix.current.makeRotationY(
//         -houses?.[houseId ?? ""]?.rotation ?? 0
//       )
//       vec.applyMatrix4(rotationMatrix.current)
//       const [x1, , z1] = vec.toArray()
//       return [x1, z1]
//     },
//     []
//   )

//   const rotateV2 = useCallback(
//     (houseId: string, [x0, z0]: [number, number]): [number, number] => {
//       const vec = new Vector3(x0, 0, z0)
//       rotationMatrix.current.makeRotationY(
//         houses?.[houseId ?? ""]?.rotation ?? 0
//       )
//       vec.applyMatrix4(rotationMatrix.current)
//       const [x1, , z1] = vec.toArray()
//       return [x1, z1]
//     },
//     []
//   )

//   return { rotateV2, unrotateV2 }
// }

export const setRaycasting = (object: Object3D, bool: boolean) => {
  object.traverse((node) => {
    if (bool) {
      node.layers.enable(RaycasterLayer.ENABLED)
      node.layers.disable(RaycasterLayer.DISABLED)
    } else {
      node.layers.enable(RaycasterLayer.DISABLED)
      node.layers.disable(RaycasterLayer.ENABLED)
    }
  })
}

export const setVisibleAndRaycast = (object: Object3D) => {
  object.traverse((node) => {
    node.visible = true
    node.layers.set(CameraLayer.VISIBLE)
    node.layers.enable(RaycasterLayer.ENABLED)
  })
}

export const setVisibleOnly = (object: Object3D) => {
  object.traverse((node) => {
    node.layers.set(CameraLayer.VISIBLE)
  })
}

export const setInvisibleNoRaycast = (object: Object3D) => {
  object.visible = false
  object.traverse((node) => {
    node.layers.set(CameraLayer.INVISIBLE)
    node.layers.enable(RaycasterLayer.DISABLED)
  })
}

export const setInvisibleButRaycast = (object: Object3D) => {
  object.traverse((node) => {
    node.layers.set(CameraLayer.INVISIBLE)
    node.layers.enable(RaycasterLayer.ENABLED)
  })
}

export const setVisible = (object: Object3D, bool: boolean) => {
  if (bool) {
    setVisibleAndRaycast(object)
  } else {
    setInvisibleNoRaycast(object)
  }
}

export const replicateObject = <T extends Object3D>(n: number, obj: T): T[] => {
  const replicated: T[] = []
  for (let i = 0; i < n; i++) {
    replicated.push(obj.clone() as T)
  }
  return replicated
}

export const addDebugLineAtZ = (
  parent: Object3D,
  z: number,
  length: number = 5,
  color: Color | number | string = 0xff0000
): void => {
  // Step 1: Create geometry for the line segment.
  const lineGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-length / 2, 0, 0),
    new Vector3(length / 2, 0, 0),
  ])

  // Step 2: Create a material for the line.
  const lineMaterial = new LineBasicMaterial({ color: color })

  // Step 3: Create the line object, set its z position, and add it to the parent.
  const line = new Line(lineGeometry, lineMaterial)
  line.position.set(0, 0, z)
  parent.add(line)
}

export const addDebugLineAtX = (
  parent: Object3D,
  x: number,
  length: number = 5,
  color: Color | number | string = 0xff0000
): void => {
  // Step 1: Create geometry for the line segment.
  const lineGeometry = new BufferGeometry().setFromPoints([
    new Vector3(x, 0, -length / 2),
    new Vector3(x, 0, length / 2),
  ])

  // Step 2: Create a material for the line.
  const lineMaterial = new LineBasicMaterial({ color: color })

  // Step 3: Create the line object and add it to the parent.
  const line = new Line(lineGeometry, lineMaterial)
  parent.add(line)
}

export { Material as ThreeMaterial } from "three"
