import { pipe } from "fp-ts/lib/function"
import { proxy, useSnapshot } from "valtio"
import {
  stretchWidthClamped,
  stretchWidthRaw,
} from "../ui-3d/grouped/stretchWidth/StretchWidth"
import { A, O, R } from "../utils/functions"
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

export const setPreviews = () => {
  for (let houseId of Object.keys(previews)) {
    pipe(
      previews[houseId].dna,
      R.toEntries,
      A.findFirst(([_, { active }]) => active),
      O.map(([_, { value }]) => {
        houses[houseId].dna = value
      })
    )

    previews[houseId].dna = {}

    delete stretchWidthRaw[houseId]
    delete stretchWidthClamped[houseId]
  }
}

export default previews
