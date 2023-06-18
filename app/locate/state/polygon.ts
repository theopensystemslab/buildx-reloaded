"use client"
import { Polygon } from "@turf/turf"
import { proxy, useSnapshot } from "valtio"
import { BUILDX_LOCAL_STORAGE_MAP_POLYGON_KEY } from "./constants"

function getInitialPolygon() {
  const rawStoragePayload = localStorage.getItem(
    BUILDX_LOCAL_STORAGE_MAP_POLYGON_KEY
  )
  if (rawStoragePayload) {
    try {
      const polygon = JSON.parse(rawStoragePayload)
      return polygon
    } catch (error) {
      console.error("Error parsing polygon from local storage:", error)
      return null
    }
  }
  return null
}

const prox = proxy<{
  polygon: Polygon | null
}>({
  polygon: getInitialPolygon(),
})

export const useMapPolygon = () => {
  const { polygon } = useSnapshot(prox) as typeof prox
  return polygon
}

export const getMapPolygon = () => {
  return prox.polygon
}

export const setMapPolygon = (polygon: Polygon) => {
  prox.polygon = polygon
  localStorage.setItem(
    BUILDX_LOCAL_STORAGE_MAP_POLYGON_KEY,
    JSON.stringify(polygon)
  )
}

export const trashMapPolygon = () => {
  prox.polygon = null
  localStorage.setItem(BUILDX_LOCAL_STORAGE_MAP_POLYGON_KEY, "null")
}
