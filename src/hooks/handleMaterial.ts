import { useMemo } from "react"
import { DoubleSide, MeshStandardMaterial } from "three"
import { LineMaterial } from "three-stdlib"
import { proxy, ref } from "valtio"
import { useDesignSettings } from "~/app/design/state/settings"

const cache = proxy<Record<string, LineMaterial>>({})

export const useHandleMaterial = () => {
  const { groundPlaneEnabled } = useDesignSettings()
  const color = groundPlaneEnabled ? "white" : "black"

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
