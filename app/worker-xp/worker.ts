import { expose } from "comlink"

const obj = {
  counter: 0,
  inc() {
    this.counter++
    const foo =
      typeof self !== "undefined" &&
      self.constructor.name === "DedicatedWorkerGlobalScope"
    console.log(typeof window === "undefined")
  },
}

export type ObjT = typeof obj

expose(obj)
