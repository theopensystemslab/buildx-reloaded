import { Remote, wrap } from "comlink"
import { SystemsAPI } from "./worker"

let worker: Remote<SystemsAPI> | null = null

const getSystemsWorker = () => {
  if (worker === null) {
    worker = wrap<SystemsAPI>(
      new Worker(new URL("./worker.ts", import.meta.url))
    )
  }
  return worker
}

export default getSystemsWorker
