import { Remote, wrap } from "comlink"
import { useEffect, useRef } from "react"
import { snapshot } from "valtio"
import { getMapPolygon } from "../../../locate/state/polygon"
import { useSubscribe } from "../../../utils/hooks"
import houses from "../houses"
import siteCtx from "../siteCtx"
import { SharingWorkerAPI } from "./worker"

export const useSharingWorker = () => {
  const ref = useRef<Remote<SharingWorkerAPI> | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url))
    ref.current = wrap<SharingWorkerAPI>(worker)
  }, [])

  useSubscribe(
    houses,
    async () => {
      if (!ref.current) return

      const polygon = getMapPolygon()

      const foo = await ref.current.compressEncode2({
        houses: snapshot(houses),
        polygon: polygon ? snapshot(polygon) : undefined,
        siteCtx: snapshot(siteCtx),
      })

      console.log(foo.length)
    },
    true
  )
}
