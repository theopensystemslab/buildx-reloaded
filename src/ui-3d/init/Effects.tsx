import highlights from "@/hooks/highlights"
import { useFBO } from "@react-three/drei"
import { invalidate, useFrame, useThree } from "@react-three/fiber"
import {
  EffectComposer,
  EffectPass,
  OutlineEffect as OutlineEffectRaw,
  RenderPass,
} from "postprocessing"
import { useEffect, useMemo } from "react"
import { subscribeKey } from "valtio/utils"

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

// export const defaultBloomParams: ConstructorParameters<
//   typeof SelectiveBloomEffect
// >[2] = {
//   intensity: 2,
//   kernelSize: 4,
//   luminanceSmoothing: 0,
//   luminanceThreshold: 0,
// }

const defaultRenderPriority: number = 1

const Effects = () => {
  const { gl, camera, size, scene } = useThree()

  const renderTarget = useFBO(size.width, size.height, { depthBuffer: true })

  // const selectiveBloomEffect = useMemo(() => {
  //   const effect = new SelectiveBloomEffect(scene, camera, {
  //     ...defaultBloomParams,
  //     width: size.width / 2,
  //     height: size.height / 2,
  //   })
  //   effect.selection.layer = 11
  //   return effect
  // }, [camera, scene])

  const outlineEffect = useMemo(() => {
    const effect = new OutlineEffectRaw(
      scene,
      camera,
      defaultOutlineEffectParams
    )
    effect.selection.layer = 12
    return effect
  }, [scene, camera])

  // const bloomPass = useMemo(() => {
  //   return new EffectPass(camera, selectiveBloomEffect)
  // }, [camera, selectiveBloomEffect])

  const effectComposer = useMemo(() => {
    const effectComposer = new EffectComposer(gl, renderTarget)
    const renderPass = new RenderPass(scene, camera)
    effectComposer.addPass(renderPass)
    // effectComposer.addPass(bloomPass)
    effectComposer.addPass(new EffectPass(camera, outlineEffect))
    return effectComposer
  }, [
    gl,
    renderTarget,
    scene,
    camera,
    outlineEffect,
    // selectiveBloomEffect
  ])

  const outline = () => {
    if (highlights.outlined.length > 0) {
      outlineEffect.selection.set(highlights.outlined)
    } else {
      outlineEffect.selection.clear()
    }
    invalidate()
  }

  subscribeKey(highlights, "outlined", outline, true)

  // subscribeKey(highlights, "illuminated", () => {
  //   if (highlights.illuminated.length > 0) {
  //     if (!bloomPass.enabled) bloomPass.enabled = true
  //     selectiveBloomEffect.selection.set(highlights.illuminated)
  //   } else bloomPass.enabled = false
  // })

  useEffect(() => {
    effectComposer.setSize(size.width, size.height)
  }, [effectComposer, size])

  useFrame(() => {
    effectComposer.render(0.02)
  }, defaultRenderPriority)

  return null
}

export default Effects
