import { expose } from "comlink"

const api = {}

export type HouseWorker = typeof api

expose(api)
