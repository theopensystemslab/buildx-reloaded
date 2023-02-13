import { useMemo } from "react"
import { DoubleSide, MeshStandardMaterial } from "three"
import { LineMaterial } from "three-stdlib"
import { proxy, ref } from "valtio"
import { useGlobals } from "./globals"

const cache = proxy<Record<string, LineMaterial>>({})

export const useHandleMaterial = () => {
  const { groundPlane } = useGlobals()
  const color = groundPlane ? "white" : "black"

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
