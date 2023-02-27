import { proxy, useSnapshot } from "valtio"
import { useSubscribe } from "../utils/hooks"
import houses from "./houses"

type Preview = {
  materials: Record<string, string>
  dna: Record<
    string,
    {
      value: string[]
      active: boolean
    }
  >
}

type Previews = Record<string, Preview>

const previews = proxy<Previews>({})

export const usePreviews = () => {
  useSubscribe(
    houses,
    () => {
      for (let houseId of Object.keys(houses)) {
        previews[houseId] = {
          materials: {},
          dna: {},
        }
      }
    },
    true
  )
}

export const useHousePreviews = (houseId: string) => {
  const housesSnap = useSnapshot(previews) as typeof previews

  return (
    housesSnap[houseId] ?? {
      materials: {},
      dna: {},
    }
  )
}

export default previews
