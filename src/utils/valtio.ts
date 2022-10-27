import { subscribe } from "valtio"

export const subscribeMapKey = <K extends unknown, V extends unknown>(
  proxyMapObject: Map<K, V>,
  key: K,
  callback: (v: V | undefined) => void
) => {
  let prev: { value: V | undefined } | undefined
  return subscribe(proxyMapObject, () => {
    const nextValue = proxyMapObject.get(key)
    if (!prev || prev.value !== nextValue) {
      prev = { value: nextValue }
      callback(nextValue)
    }
  })
}
