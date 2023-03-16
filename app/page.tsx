"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const Index = () => {
  const router = useRouter()
  useEffect(() => {
    router.push("/locate")
  }, [router])
  return <div></div>
}

export default Index
