"use client"
import { pipe } from "fp-ts/lib/function"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { proxy, useSnapshot } from "valtio"
import { Close } from "~/ui/icons"
import { useClickAway } from "~/ui/utils"
import { A } from "~/utils/functions"
import { useGetColorClass } from "../../db/exports"
import { House, housesToRecord, useHouses } from "../../db/user"

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
  const houses = useHouses()

  return useMemo(
    () =>
      pipe(
        houses,
        A.filter((k) => selectedHouseIds.includes(k.houseId))
      ),
    [houses, selectedHouseIds]
  )
}

const HousesPillsSelector = () => {
  const houses = useHouses()

  useEffect(() => {
    store.selectedHouses = Object.keys(housesToRecord(houses))
  }, [houses])

  const selectedHouseIds = useSelectedHouseIds()

  const getColorClass = useGetColorClass()

  const houseSelectOptions: { houseId: string; houseName: string }[] =
    Object.entries(houses)
      .map(([houseId, house]) =>
        selectedHouseIds.includes(houseId)
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

  const selectedHouses: House[] = pipe(
    selectedHouseIds,
    A.filterMap((houseId) =>
      pipe(
        houses,
        A.findFirst((house) => house.houseId === houseId)
      )
    )
  )

  return (
    <div className="flex flex-wrap items-center space-x-2 px-4 py-1.5 border-b">
      {selectedHouses.map((house) => {
        const { houseId } = house

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
                selectedHouseIds.length > 0 ? "right-0" : "left-0"
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
