"use client"
import { Remote, wrap } from "comlink"
import { isSSR } from "../utils/next"
import type { LayoutsAPI } from "./layouts/worker"
import type { ModelsAPI } from "./models"
import { ExportersAPI } from "./exporters/worker"

let systemsWorker: Worker | null = null
let layoutsWorker: Remote<LayoutsAPI> | null = null
let modelsWorker: Remote<ModelsAPI> | null = null
let exportersWorker: Remote<ExportersAPI> | null = null

export const initSystemsWorker = () => {
  if (!isSSR() && systemsWorker === null) {
    systemsWorker = new Worker(new URL("./systems.ts", import.meta.url))
  }
}

export const getSystemsWorker = (): Worker => {
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

export const getLayoutsWorker = (): Remote<LayoutsAPI> => {
  if (isSSR()) return undefined as any
  if (layoutsWorker === null) throw new Error(`couldn't get layoutsWorker`)
  return layoutsWorker
}

export const initModelsWorker = () => {
  if (!isSSR() && modelsWorker === null) {
    modelsWorker = wrap(new Worker(new URL("./models.ts", import.meta.url)))
  }
}

export const getModelsWorker = (): Remote<ModelsAPI> => {
  if (isSSR()) return undefined as any
  if (modelsWorker === null) throw new Error(`couldn't get modelsWorker`)
  return modelsWorker
}

export const initExportersWorker = () => {
  if (!isSSR() && exportersWorker === null) {
    exportersWorker = wrap(
      new Worker(new URL("./exporters/worker.ts", import.meta.url))
    )
  }
}

export const getExportersWorker = (): Remote<ExportersAPI> => {
  if (isSSR()) return undefined as any
  if (exportersWorker === null) throw new Error(`couldn't get exportersWorker`)
  return exportersWorker
}
