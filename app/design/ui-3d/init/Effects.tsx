import { useFBO } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import {
  EffectComposer,
  EffectPass,
  OutlineEffect as OutlineEffectRaw,
  RenderPass,
} from "postprocessing"
import { useEffect, useMemo } from "react"
import { useOutlineEvent } from "../fresh/events/outlines"

export type UseOutlineEffectParams = ConstructorParameters<
  typeof OutlineEffectRaw
>[2]

export const defaultOutlineEffectParams: UseOutlineEffectParams = {
  edgeStrength: 8,
  pulseSpeed: 0.0,
  visibleEdgeColor: 0xffffff,
  hiddenEdgeColor: 0xffffff,
  blur: false,
}

const defaultRenderPriority: number = 1

const Effects = () => {
  const { gl, camera, size, scene } = useThree()

  const renderTarget = useFBO(size.width, size.height, {
    depthBuffer: true,
    stencilBuffer: true,
  })

  const outlineEffect = useMemo(() => {
    const effect = new OutlineEffectRaw(
      scene,
      camera,
      defaultOutlineEffectParams
    )
    effect.selection.layer = 12
    return effect
  }, [scene, camera])

  const effectComposer = useMemo(() => {
    const effectComposer = new EffectComposer(gl, renderTarget)
    const renderPass = new RenderPass(scene, camera)
    effectComposer.addPass(renderPass)
    effectComposer.addPass(new EffectPass(camera, outlineEffect))
    return effectComposer
  }, [gl, renderTarget, scene, camera, outlineEffect])

  useOutlineEvent(({ objects }) => {
    outlineEffect.selection.set(objects)
  })

  useEffect(() => {
    effectComposer.setSize(size.width, size.height)
  }, [effectComposer, size])

  useFrame(() => {
    effectComposer.render(0.02)
  }, defaultRenderPriority)

  return null
}

export default Effects
