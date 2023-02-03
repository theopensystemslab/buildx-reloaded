import CryptoJS from "crypto-js"
import { BufferAttribute, BufferGeometry } from "three"
import { proxy, ref, useSnapshot } from "valtio"

type GeometryHash = string

export const hashedGeometries = proxy<Record<GeometryHash, BufferGeometry>>({})

export const useGeometry = (geometryHash: string) => {
  const snap = useSnapshot(hashedGeometries) as typeof hashedGeometries
  return snap[geometryHash]
}

export const hashGeometry = (geom: BufferGeometry) => {
  // const uv = geom.getAttribute("uv") as BufferAttribute
  const position = geom.getAttribute("position") as BufferAttribute
  const normal = geom.getAttribute("normal") as BufferAttribute

  const attributeToString = (attribute: BufferAttribute) =>
    `size:${attribute.itemSize};count:${
      attribute.count
    };array:${attribute.array.toString()}`

  const hash = CryptoJS.MD5(
    Object.entries({ position, normal })
      .map(([k, v]) => {
        return `{${k}::${attributeToString(v)}}`
      })
      .join(",")
  ).toString()

  const maybeHashedGeometry = hashedGeometries?.[hash]
  if (maybeHashedGeometry) return hash

  hashedGeometries[hash] = ref(geom)
  return hash
}
