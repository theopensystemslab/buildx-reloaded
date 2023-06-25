import { pipe } from "fp-ts/lib/function"
import { proxy, useSnapshot } from "valtio"
import {
  stretchWidthClamped,
  stretchWidthRaw,
} from "../ui-3d/grouped/stretchWidth/StretchWidth"
import { A, O, R } from "~/utils/functions"
import { useSubscribe } from "~/utils/hooks"
import houses from "./houses"

type Preview = {
  materials: Record<string, string>
  dnas: Record<
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
          dnas: {},
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
      dnas: {},
    }
  )
}

export const setPreviews = () => {
  for (let houseId of Object.keys(previews)) {
    pipe(
      previews[houseId].dnas,
      R.toEntries,
      A.findFirst(([_, { active }]) => active),
      O.map(([_, { value }]) => {
        houses[houseId].dnas = value
      })
    )

    previews[houseId].dnas = {}

    delete stretchWidthRaw[houseId]
    delete stretchWidthClamped[houseId]
  }
}

export default previews
