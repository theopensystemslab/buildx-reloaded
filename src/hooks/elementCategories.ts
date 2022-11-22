import { identity, pipe } from "fp-ts/lib/function"
import { useCallback } from "react"
import { proxy, useSnapshot } from "valtio"
import { useSystemElements } from "../data/elements"
import { O, RA, RR, S } from "../utils/functions"

const elementCategories = proxy<{ [k: string]: boolean }>({
  "Internal finishes": false,
  "External finishes": false,
  Insulation: false,
  Services: false,
  Structure: false,
  "Windows & doors": false,
  Foundations: false,
  Furnishings: false,
})

export const useElementCategories = () => {
  const categories = useSnapshot(elementCategories)
  return categories
}

export const useGetElementVisible = (systemId: string) => {
  const elements = useSystemElements({ systemId })
  const categories = useSnapshot(elementCategories)

  return useCallback(
    (elementName: string): boolean =>
      true ||
      pipe(
        elements,
        RA.findFirstMap((element) =>
          element.name === elementName
            ? O.some(
                pipe(
                  categories,
                  RR.filter((x) => x),
                  RR.keys,
                  (ks) => ks.includes(element.category)
                )
              )
            : O.none
        ),
        O.match(() => false, identity)
      ),
    [categories, elements]
  )
}

export default elementCategories
