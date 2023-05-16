import { z } from "zod"
import { convertSpeckleToThree } from "./convertSpeckleToThree"

const displayValueSchema = z.object({
  speckle_type: z.literal("Objects.Geometry.Mesh"),
  vertices: z.array(z.number()),
  faces: z.array(z.number()),
})

const childSchema = z
  .object({
    type: z.string(),
    "@displayValue": z
      .array(displayValueSchema)
      .length(1)
      .transform(([x]) => x),
  })
  .transform(({ type, "@displayValue": { faces, vertices } }) => ({
    type,
    faces,
    vertices,
  }))
  .nullable()
  .default(null)

function isNonNull<T>(x: T | null): x is T {
  return x !== null
}

const ifcSiteSchema = z.object({
  type: z.literal("IFCSITE"),
  children: z
    .array(childSchema)
    .transform((children) => children.filter(isNonNull)),
})

const ifcProjectSchema = z
  .object({
    type: z.literal("IFCPROJECT"),
    children: z
      .array(ifcSiteSchema)
      .length(1)
      .transform(([x]) => x),
  })
  .transform(({ children }) => children)

const speckleIfcParser = ifcProjectSchema.transform((x) =>
  x.children.map(({ faces, vertices, type }) => ({
    ifcTag: type,
    geometry: convertSpeckleToThree({ faces, vertices }),
  }))
)

export default speckleIfcParser
