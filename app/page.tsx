"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { decodeEncodedStoragePayload } from "./design/state/sharing"
import Loader from "./ui/Loader"
import { z } from "zod"
import { housesParser, saveHouses } from "./data/houses"
import { polygonGeometryParser } from "./locate/state/geojson"
import { siteCtxParser } from "./design/state/siteCtx"
import { BUILDX_LOCAL_STORAGE_CONTEXT_KEY } from "./design/state/constants"
import { BUILDX_LOCAL_STORAGE_MAP_POLYGON_KEY } from "./locate/state/constants"

const Index = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get("q")

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loading) router.push("/locate")
    if (!q) {
      setLoading(false)
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

      setLoading(false)
    } catch (e) {
      setLoading(false)
    }
  }, [loading, q, router])

  return <Loader />
}

export default Index
