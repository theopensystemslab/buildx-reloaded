import { BufferAttribute, BufferGeometry } from "three"
import { proxyMap } from "valtio/utils"
import CryptoJS from "crypto-js"

type GeometryHash = string

export const hashedGeometries = proxyMap<GeometryHash, BufferGeometry>()

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

  const maybeHashedGeometry = hashedGeometries.get(hash)
  if (maybeHashedGeometry) return hash

  hashedGeometries.set(hash, geom)
  return hash
}
