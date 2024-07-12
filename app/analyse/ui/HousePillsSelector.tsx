"use client"
import { useHouses } from "@opensystemslab/buildx-core"
import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import { proxy, useSnapshot } from "valtio"
import { Close } from "~/ui/icons"
import { A } from "~/utils/functions"

const store = proxy<{
  selectedHouseIds: string[]
}>({
  selectedHouseIds: [],
})

export const useSelectedHouseIds = (): string[] => {
  const { selectedHouseIds } = useSnapshot(store) as typeof store

  return selectedHouseIds

  // const pathname = usePathname()

  // const { mode, houseId } = useSiteCtx()

  // if (pathname === "/design") {
  //   if (mode !== SiteCtxModeEnum.Enum.SITE && houseId) return [houseId]
  //   else return houses.map((house) => house.houseId)
  // }
}

export const useSelectedHouses = () => {
  const houses = useHouses()
  const selectedHouseIds = useSelectedHouseIds()

  return useMemo(
    () =>
      pipe(
        houses,
        A.filter(({ houseId }) => selectedHouseIds.includes(houseId))
      ),
    [houses, selectedHouseIds]
  )
}

export const setSelectedHouseIds = (newSelectedHouseIds: string[]) => {
  store.selectedHouseIds = newSelectedHouseIds
}

export const removeSelectedHouseId = (houseId: string) => {
  setSelectedHouseIds(store.selectedHouseIds.filter((x) => x !== houseId))
}

const HousesPillsSelector = () => {
  const selectedHouses = useSelectedHouses()

  // Render the component UI
  return (
    <div>
      {selectedHouses.map((house) => (
        <div key={house.houseId}>
          {house.friendlyName}
          <button onClick={() => removeSelectedHouseId(house.houseId)}>
            <Close />
          </button>
        </div>
      ))}
    </div>
  )
}

export default HousesPillsSelector
