import { useGLTF as useGLTFDrei } from "@react-three/drei"
import { RootState } from "@react-three/fiber"
import { Group, Mesh, Object3D, Scene } from "three"
import { CameraLayer, RaycasterLayer } from "../constants"

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
