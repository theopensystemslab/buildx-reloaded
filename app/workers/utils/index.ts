import { useEffect, useRef } from "react"
import { Remote, wrap, releaseProxy } from "comlink"

export const useWorker = <T>(workerURL: URL) => {
  const ref = useRef<Remote<T> | null>(null)

  useEffect(() => {
    const worker = new Worker(workerURL)
    ref.current = wrap<T>(worker)

    return () => {
      ref.current?.[releaseProxy]()
      worker.terminate()
    }
  }, [workerURL])

  return ref
}

export const useSharedWorker = <T>(workerURL: URL) => {
  const ref = useRef<Remote<T> | null>(null)

  useEffect(() => {
    let worker: SharedWorker | Worker
    try {
      worker = new SharedWorker(workerURL)
      ref.current = wrap<T>(worker.port)
      worker.port.start()
    } catch (error) {
      // Fallback to a regular Worker if SharedWorker is not supported
      worker = new Worker(workerURL)
      ref.current = wrap<T>(worker)
    }

    return () => {
      ref.current?.[releaseProxy]()
      if (worker instanceof SharedWorker) {
        worker.port.close()
      } else {
        worker.terminate()
      }
    }
  }, [workerURL])

  return ref
}
