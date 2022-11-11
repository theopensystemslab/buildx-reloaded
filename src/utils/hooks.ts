import { useEffect } from "react"
import { subscribe } from "valtio"
import { subscribeKey } from "valtio/utils"

export const useSubscribe = (
  proxy: Parameters<typeof subscribe>[0],
  go: Parameters<typeof subscribe>[1]
) => useEffect(() => subscribe(proxy, go))

export const useSubscribeKey = <T extends object, K extends keyof T>(
  proxy: T,
  key: K,
  go: { (): void; (value: T[K]): void }
) => useEffect(() => subscribeKey<T, K>(proxy, key, go))
