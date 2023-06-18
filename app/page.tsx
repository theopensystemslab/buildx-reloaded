"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

const Index = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get("q")

  useEffect(() => {
    console.log({ q })
    console.log("push")
    // router.push("/locate")
  }, [q, router])
  return <div></div>
}

export default Index
