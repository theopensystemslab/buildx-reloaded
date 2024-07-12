"use client"
import { decodeShareUrlPayload, setHouses } from "@opensystemslab/buildx-core"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

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
      const { houses } = decodeShareUrlPayload(q)

      setHouses(houses)

      router.push("/design")
    } catch (e) {
      console.error(e)
      router.push("/locate")
    }
  }, [q, router])

  return <div></div>
}

export default Index
