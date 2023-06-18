import base64url from "base64url"
import { Remote, wrap } from "comlink"
import { flow } from "fp-ts/lib/function"
import { inflate } from "pako"
import { useEffect, useRef } from "react"
import { snapshot } from "valtio"
import { getMapPolygon } from "../../../locate/state/polygon"
import { useSubscribe } from "../../../utils/hooks"
import houses from "../houses"
import siteCtx from "../siteCtx"
import { SharingWorkerAPI } from "./worker"

const textDecoder = new TextDecoder()

export const decodeEncodedStoragePayload = flow(
  base64url.toBuffer,
  inflate,
  (x) => textDecoder.decode(x),
  JSON.parse
)

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

      const encodedStore = await ref.current.compressEncode({
        houses: snapshot(houses),
        polygon: polygon ? snapshot(polygon) : undefined,
        siteCtx: snapshot(siteCtx),
      })

      console.log(encodedStore)
    },
    true
  )
}
