"use client"
import { Remote, wrap } from "comlink"
import { isSSR } from "../utils/next"
import type { LayoutsAPI } from "./layouts/worker"

let systemsWorker: Worker | null = null
let layoutsWorker: Remote<LayoutsAPI> | null = null

export const getSystemsWorker = () => {
  if (!isSSR() && systemsWorker === null) {
    systemsWorker = new Worker(new URL("./systems.ts", import.meta.url))
  }
  return systemsWorker
}

export const getLayoutsWorker = () => {
  if (!isSSR() && layoutsWorker === null) {
    layoutsWorker = wrap(
      new Worker(new URL("./layouts/worker.ts", import.meta.url))
    )
  }
  return layoutsWorker
}