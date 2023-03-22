"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const BuildIndex = () => {
  const router = useRouter()
  useEffect(() => {
    router.push("/build/overview")
  }, [router])
  return null
}

export default BuildIndex
