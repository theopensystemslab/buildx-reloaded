import { releaseProxy, Remote, wrap } from "comlink"
import { useEffect, useRef } from "react"
import { HouseWorker } from "./worker"

export const useHouseWorker = () => {
  const ref = useRef<Remote<HouseWorker> | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url))
    ref.current = wrap<HouseWorker>(worker)

    return () => {
      ref.current?.[releaseProxy]()
      worker.terminate()
    }
  }, [])
}
