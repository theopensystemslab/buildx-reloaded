"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { z } from "zod"
import { housesParser, saveHouses } from "./data/houses"
import { BUILDX_LOCAL_STORAGE_CONTEXT_KEY } from "./design/state/constants"
import { decodeEncodedStoragePayload } from "./design/state/sharing"
import { siteCtxParser } from "./design/state/siteCtx"
import { BUILDX_LOCAL_STORAGE_MAP_POLYGON_KEY } from "./locate/state/constants"
import { polygonGeometryParser } from "./locate/state/geojson"
import Loader from "./ui/Loader"

const Index = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get("q")

  useEffect(() => {
    if (!q) {
      router.push("/locate")
      return
    }

    try {
      const parser = z.object({
        houses: housesParser,
        polygon: polygonGeometryParser,
        siteCtx: siteCtxParser,
      })

      const decoded = decodeEncodedStoragePayload(q)

      const { houses, polygon, siteCtx } = parser.parse(decoded)

      saveHouses(houses)

      localStorage.setItem(
        BUILDX_LOCAL_STORAGE_CONTEXT_KEY,
        JSON.stringify(siteCtx)
      )

      localStorage.setItem(
        BUILDX_LOCAL_STORAGE_MAP_POLYGON_KEY,
        JSON.stringify(polygon)
      )

      router.push("/design")
    } catch (e) {
      router.push("/locate")
    }
  }, [q, router])

  return <Loader />
}

export default Index
