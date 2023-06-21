"use client"
import { releaseProxy, Remote, wrap } from "comlink"
import { useEffect, useRef } from "react"
import { SystemsAPI } from "./worker"

export const SystemsWorker = () => {
  const ref = useRef<Remote<SystemsAPI> | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url))
    ref.current = wrap<SystemsAPI>(worker)

    return () => {
      ref.current?.[releaseProxy]()
      worker.terminate()
    }
  }, [])

  return null
}
