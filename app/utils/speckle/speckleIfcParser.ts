import { pipe } from "fp-ts/lib/function"
import { z } from "zod"
import { A } from "../functions"
import { convertSpeckleToThree } from "./convertSpeckleToThree"

const displayValueSchema = z.object({
  speckle_type: z.literal("Objects.Geometry.Mesh"),
  vertices: z.array(z.number()),
  faces: z.array(z.number()),
})

const childSchema = z
  .object({
    type: z.string(),
    "@displayValue": z.array(displayValueSchema).default([]),
  })
  .transform(({ type, "@displayValue": values }) => ({
    type,
    values,
  }))

function isNonNull<T>(x: T | null): x is T {
  return x !== null
}

const ifcSiteSchema = z.object({
  type: z.literal("IFCSITE"),
  elements: z.array(childSchema).transform((elements) =>
    pipe(
      elements,
      A.filter(isNonNull),
      A.chain(({ type, values }) =>
        values.map(({ faces, vertices }) => ({ type, faces, vertices }))
      )
    )
  ),
})

const ifcProjectSchema = z
  .object({
    type: z.literal("IFCPROJECT"),
    elements: z
      .array(ifcSiteSchema)
      .length(1)
      .transform(([x]) => x),
  })
  .transform(({ elements }) => elements)

const speckleIfcParser = ifcProjectSchema.transform((x) =>
  x.elements.map(({ faces, vertices, type }) => ({
    ifcTag: type,
    geometry: convertSpeckleToThree({ faces, vertices }),
  }))
)

export default speckleIfcParser
