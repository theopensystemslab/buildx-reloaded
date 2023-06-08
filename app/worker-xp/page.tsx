"use client"
import { Remote, wrap } from "comlink"
import React, { useEffect, useRef } from "react"
import type { ObjT } from "./worker"

const WorkerXpPage = () => {
  const [count, setCount] = React.useState(0)
  const ref = useRef<Remote<ObjT> | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url))
    ref.current = wrap<ObjT>(worker)
  }, [])
  return (
    <button
      onClick={async () => {
        if (!ref.current) return
        await ref.current.inc()
        setCount(await ref.current.counter)
      }}
    >
      {count} increment
    </button>
  )
}

export default WorkerXpPage
