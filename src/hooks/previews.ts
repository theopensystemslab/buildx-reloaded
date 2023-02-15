import { proxy, useSnapshot } from "valtio"
import { useSubscribe } from "../utils/hooks"
import houses from "./houses"

type Preview = {
  materials: Record<string, string>
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
        }
      }
    },
    true
  )
}

export const useHousePreviews = (houseId: string) => {
  const housesSnap = useSnapshot(previews) as typeof previews

  return housesSnap[houseId]
}

export default previews
