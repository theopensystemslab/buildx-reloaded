import { proxy, useSnapshot } from "valtio"
import { useSubscribeKey } from "../../src/utils/hooks"

type LocateState = "GEOCODING" | "DRAWING_POLYGON" | "COMPLETE"

type P = {
  locateState: LocateState
}

const p = proxy<P>({
  locateState: "GEOCODING",
})

export const useLocateState = () => {
  const { locateState } = useSnapshot(p)
  return locateState
}

export const setLocateState = (next: LocateState) => {
  p.locateState = next
}

export const useSubscribeLocateState = (
  f: (l: LocateState) => void,
  init = false
) =>
  useSubscribeKey(
    p,
    "locateState",
    () => {
      f(p.locateState)
    },
    init
  )
