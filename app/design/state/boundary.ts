import { toMercator, Polygon, Coord, Position } from "@turf/turf"
import { useMapPolygon } from "../../locate/state/polygon"
import centroid from "@turf/centroid"

export const useSiteBoundaryPoints = (): [number, number][] => {
  const polygon: Polygon | null = useMapPolygon()

  if (polygon === null) return []

  // Find the centroid of the polygon
  const center: Coord = centroid(polygon)

  // Transform the polygon from WGS to Web Mercator coordinates
  const webMercatorPolygon: Polygon = toMercator(polygon)

  // Transform the centroid from WGS to Web Mercator coordinates
  const webMercatorCenter = toMercator(center).geometry.coordinates

  // Helper function to check if the position is [number, number]
  const is2DPosition = (pos: Position): pos is [number, number] => {
    return pos.length === 2
  }

  // Translate the coordinates so the center of the polygon is at (0, 0) and flip the east and west directions
  const translatedPoints: [number, number][] =
    webMercatorPolygon.coordinates[0].map((pos: Position) => {
      if (is2DPosition(pos)) {
        const [x, y] = pos
        return [-(x - webMercatorCenter[0]), y - webMercatorCenter[1]] // Negate the x value to flip east and west directions
      } else {
        throw new Error("Unexpected position format")
      }
    })

  return translatedPoints
}
