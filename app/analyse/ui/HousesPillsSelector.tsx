"use client"
import { useClickAway } from "~/app/ui/utils"
import { Close } from "~/app/ui/icons"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { proxy, useSnapshot } from "valtio"
import { R } from "../../../src/utils/functions"
import houses, { useHouses } from "../../design/state/houses"

const store = proxy<{
  selectedHouses: string[]
}>({
  selectedHouses: [],
})

const setSelectedHouseIds = (f: (prev: string[]) => string[]) => {
  store.selectedHouses = f(store.selectedHouses)
}

export const useSelectedHouseIds = () => {
  const { selectedHouses } = useSnapshot(store) as typeof store
  return selectedHouses
}

export const useSelectedHouses = () => {
  const selectedHouseIds = useSelectedHouseIds()

  return useMemo(
    () =>
      pipe(
        houses,
        R.filterWithIndex((k) => selectedHouseIds.includes(k)),
        values
      ),
    [selectedHouseIds]
  )
}

export const buildingColorVariants: Record<number, string> = {
  0: "bg-building-1",
  1: "bg-building-2",
  2: "bg-building-3",
  3: "bg-building-4",
  4: "bg-building-5",
  5: "bg-building-6",
  6: "bg-building-7",
  7: "bg-building-8",
  8: "bg-building-9",
  9: "bg-building-10",
  10: "bg-building-11",
  11: "bg-building-12",
  12: "bg-building-13",
  13: "bg-building-14",
  14: "bg-building-15",
  15: "bg-building-16",
  16: "bg-building-17",
  17: "bg-building-18",
  18: "bg-building-19",
  19: "bg-building-20",
}

export const staleColorVariants: Record<number, string> = {
  0: "bg-grey-50",
  1: "bg-grey-40",
  2: "bg-grey-30",
  3: "bg-grey-80",
  4: "bg-grey-70",
  5: "bg-grey-60",
  // 6: "bg-grey-70",
  // 7: "bg-grey-80",
  // 8: "bg-grey-90",
  // 9: "bg-grey-100",
}

export const useGetColorClass = () => {
  const selectedHouseIds = useSelectedHouseIds()

  return (houseId: string, opts: { stale?: boolean } = {}) => {
    const { stale = false } = opts
    const index = selectedHouseIds.indexOf(houseId)
    return stale ? staleColorVariants[index] : buildingColorVariants[index]
  }
}

const HousesPillsSelector = () => {
  const houses = useHouses()

  useEffect(() => {
    store.selectedHouses = Object.keys(houses)
  }, [houses])

  const selectedHouses = useSelectedHouseIds()

  const getColorClass = useGetColorClass()

  const houseSelectOptions: { houseId: string; houseName: string }[] =
    Object.entries(houses)
      .map(([houseId, house]) =>
        selectedHouses.includes(houseId)
          ? null
          : {
              houseId,
              houseName: house.friendlyName,
            }
      )
      .filter((v): v is { houseId: string; houseName: string } => Boolean(v))

  const [expanded, setExpanded] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const closeDropdown = useCallback(() => {
    setExpanded(false)
  }, [setExpanded])

  useClickAway(dropdownRef, closeDropdown)

  if (Object.values(houses).length === 0) {
    return <p className="px-4 py-2 text-white">No houses available.</p>
  }

  return (
    <div className="flex flex-wrap items-center space-x-2 px-4 py-1.5 border-b">
      {selectedHouses.map((houseId, index) => {
        const house = houses[houseId]
        if (!house) {
          return null
        }

        const colorClass = getColorClass(houseId)

        return (
          <p
            key={houseId}
            className={`inline-flex items-center space-x-1 overflow-hidden rounded-full ${colorClass}`}
          >
            <span className="inline-block py-1 pl-3 text-sm font-semibold tracking-wide">
              {house.friendlyName}
            </span>
            <button
              className="h-8 w-8 p-0.5 transition-colors duration-200 hover:bg-[rgba(0,0,0,0.05)]"
              onClick={() => {
                setSelectedHouseIds((prev) =>
                  prev.filter((id) => id !== houseId)
                )
              }}
            >
              <Close />
            </button>
          </p>
        )
      })}

      {houseSelectOptions.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            className="w-10 py-1 text-center text-2xl leading-none text-grey-40 transition-colors duration-200 hover:text-white"
            onClick={() => {
              setExpanded((prev) => !prev)
            }}
          >
            +
          </button>

          {expanded && (
            <div
              className={`absolute -bottom-1 z-40 w-40 translate-y-full transform overflow-hidden rounded bg-white shadow-lg ${
                selectedHouses.length > 0 ? "right-0" : "left-0"
              }`}
            >
              {houseSelectOptions.map((houseSelectOption) => (
                <button
                  className="block w-full px-4 py-2 text-left transition-colors duration-200 hover:bg-gray-100"
                  key={houseSelectOption.houseId}
                  onClick={() => {
                    setSelectedHouseIds((prev) => [
                      ...prev,
                      houseSelectOption.houseId,
                    ])
                  }}
                  value={houseSelectOption.houseName}
                >
                  {houseSelectOption.houseName}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default HousesPillsSelector
