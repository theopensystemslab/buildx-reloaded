import { proxy, useSnapshot } from "valtio"

const prox = proxy<{
  sidebar: boolean
  // preload: boolean
  // debug: boolean
}>({
  sidebar: false,
  // preload: true,
  // debug: false,
})

export const useAppSettings = () => {
  return useSnapshot(prox)
}

export const setSidebar = (b: boolean) => {
  prox.sidebar = b
}
