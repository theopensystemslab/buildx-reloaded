import { z } from "zod"

// Define a Zod schema for a GeoJSON Position (longitude, latitude)
export const positionParser = z.tuple([z.number(), z.number()])

// Define a Zod schema for a GeoJSON LinearRing (an array of Positions)
const linearRingParser = z.array(positionParser)

// Define a Zod schema for a GeoJSON Polygon
export const polygonGeometryParser = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(linearRingParser),
})

// Define a Zod schema for GeoJSON Feature with a Polygon
export const polygonFeatureParser = z.object({
  type: z.literal("Feature"),
  properties: z.record(z.unknown()),
  geometry: polygonGeometryParser,
})
