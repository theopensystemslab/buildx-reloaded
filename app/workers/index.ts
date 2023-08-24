"use client"
import { Remote, wrap } from "comlink"
import { isSSR } from "../utils/next"
import type { LayoutsAPI } from "./layouts/worker"
import type { ModelsAPI } from "./models"

let systemsWorker: Worker | null = null
let layoutsWorker: Remote<LayoutsAPI> | null = null
let modelsWorker: Remote<ModelsAPI> | null = null

export const initSystemsWorker = () => {
  if (!isSSR() && systemsWorker === null) {
    systemsWorker = new Worker(new URL("./systems.ts", import.meta.url))
  }
}

export const getSystemsWorker = () => {
  if (isSSR()) return undefined as any
  if (systemsWorker === null) throw new Error(`couldn't get systemsWorker`)
  return systemsWorker
}

export const initLayoutsWorker = () => {
  if (!isSSR() && layoutsWorker === null) {
    layoutsWorker = wrap(
      new Worker(new URL("./layouts/worker.ts", import.meta.url))
    )
  }
}

export const getLayoutsWorker = () => {
  if (isSSR()) return undefined as any
  if (layoutsWorker === null) throw new Error(`couldn't get layoutsWorker`)
  return layoutsWorker
}

export const initModelsWorker = () => {
  if (!isSSR() && modelsWorker === null) {
    modelsWorker = wrap(new Worker(new URL("./models.ts", import.meta.url)))
  }
}

export const getModelsWorker = () => {
  if (isSSR()) return undefined as any
  if (modelsWorker === null) throw new Error(`couldn't get modelsWorker`)
  return modelsWorker
}
