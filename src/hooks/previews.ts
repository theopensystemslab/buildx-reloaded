import { proxy, useSnapshot } from "valtio"
import { useSubscribe } from "../utils/hooks"
import houses from "./houses"

type Preview = {
  materials: Record<string, string>
  dna: string[] | null
}

type Previews = Record<string, Preview>

const previews = proxy<Previews>({})

const emptyPreviews = {
  materials: {},
  dna: null,
}

export const usePreviews = () => {
  useSubscribe(
    houses,
    () => {
      for (let houseId of Object.keys(houses)) {
        previews[houseId] = emptyPreviews
      }
    },
    true
  )
}

export const useHousePreviews = (houseId: string) => {
  const housesSnap = useSnapshot(previews) as typeof previews

  return housesSnap[houseId] ?? emptyPreviews
}

export default previews