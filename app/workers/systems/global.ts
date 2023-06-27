"use client"
import { Remote, wrap } from "comlink"
import { isSSR } from "../../utils/next"
import { SystemsAPI } from "./worker"

let worker: Remote<SystemsAPI> | null = null

const getSystemsWorker = () => {
  if (!isSSR() && worker === null) {
    worker = wrap<SystemsAPI>(
      new Worker(new URL("./worker.ts", import.meta.url))
    )
  }
  return worker
}

export default getSystemsWorker
