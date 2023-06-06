import { useMemo } from "react"
import { DoubleSide, MeshStandardMaterial } from "three"
import { LineMaterial } from "three-stdlib"
import { proxy, ref } from "valtio"
import { useDesignSettings } from "~/design/state/settings"
import tailwindConfig from "@/tailwind.config"

const cache = proxy<Record<string, LineMaterial>>({})

export const useHandleMaterial = () => {
  const { groundPlaneEnabled } = useDesignSettings()

  const grey =
    (tailwindConfig.theme?.extend?.colors as any)?.["grey"]?.["90"] ?? "black"

  const color = groundPlaneEnabled ? "white" : grey

  return useMemo(() => {
    if (!cache[color]) {
      cache[color] = ref(
        new MeshStandardMaterial({
          color,
          emissive: color,
          side: DoubleSide,
        })
      ) as any
    }
    return cache[color]
  }, [color])
}
