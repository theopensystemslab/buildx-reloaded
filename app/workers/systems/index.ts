"use client"
import { releaseProxy, Remote, wrap } from "comlink"
import { useEffect, useRef } from "react"
import { useEvent } from "react-use"
import { ColumnLayout } from "../../design/state/layouts"
import { SystemsAPI } from "./worker"

const COMPUTE_LAYOUT_EVENT = "ComputeLayoutEvent"
const COMPUTED_LAYOUT_EVENT = "ComputedLayoutEvent"

export type ComputeLayoutEventDetail = {
  houseId: string
  systemId: string
  dnas: string[]
}

type ComputeLayoutEvent = {
  type: typeof COMPUTE_LAYOUT_EVENT
  detail: ComputeLayoutEventDetail
}

export const dispatchComputeLayoutEvent = (
  detail: ComputeLayoutEventDetail
) => {
  dispatchEvent(
    new CustomEvent(COMPUTE_LAYOUT_EVENT, {
      detail,
    })
  )
}

type ComputedLayoutEventDetail = {
  houseId: string
  layout: ColumnLayout
}

type ComputedLayoutEvent = {
  type: typeof COMPUTED_LAYOUT_EVENT
  detail: ComputedLayoutEventDetail
}

const dispatchComputedLayoutEvent = (detail: ComputedLayoutEventDetail) => {
  dispatchEvent(
    new CustomEvent(COMPUTED_LAYOUT_EVENT, {
      detail,
    })
  )
}

export const useHouseLayoutEvents = (
  houseId: string,
  cb: (layout: ColumnLayout) => void
) => {
  useEvent(COMPUTED_LAYOUT_EVENT, ({ detail }: ComputedLayoutEvent) => {
    if (houseId !== detail.houseId) return
    cb(detail.layout)
  })
}

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

  useEvent(
    COMPUTE_LAYOUT_EVENT,
    async ({ detail: { houseId, systemId, dnas } }: ComputeLayoutEvent) => {
      const layout = await ref.current?.getLayout({
        houseId,
        systemId,
        dnas,
      })
      if (layout) dispatchComputedLayoutEvent({ houseId, layout })
    }
  )

  return null
}
