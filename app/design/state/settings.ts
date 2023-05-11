import { proxy, useSnapshot } from "valtio"

const prox = proxy<{
  mapEnabled: boolean
}>({
  mapEnabled: false,
})

export const useDesignSettings = () => {
  return useSnapshot(prox)
}
