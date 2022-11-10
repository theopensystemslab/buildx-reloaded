import { useGLTF as useGLTFDrei } from "@react-three/drei"
import { RootState } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import {
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Scene,
} from "three"
import { CameraLayer, RaycasterLayer } from "../constants"
import { Material } from "../data/materials"

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
