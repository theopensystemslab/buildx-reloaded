"use client"
import { type Houses } from "~/server/data/house"
import { Close } from "@/ui/icons"
import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { useHouses } from "../../src/hooks/houses"
import { useClickAway } from "../../src/ui/common/utils"

const colorVariants: Record<number, string> = {
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

const HousesPillsSelector = () => {
  const houses = useHouses()
  const [selectedHouses, setSelectedHouses] = useState<string[]>(
    Object.keys(houses)
  )
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

  // if (Object.values(houses).length === 0) {
  //   return <p className="px-4 py-2 text-white">No houses available.</p>
  // }

  // return null

  return (
    <div className="flex flex-wrap items-center space-x-2 px-4 py-1.5">
      {selectedHouses.map((houseId, index) => {
        const house = houses[houseId]
        if (!house) {
          return null
        }

        const colorClassName = colorVariants[index]

        return (
          <p
            key={houseId}
            className={`inline-flex items-center space-x-1 overflow-hidden rounded-full ${colorClassName}`}
          >
            <span className="inline-block py-1 pl-3">{house.friendlyName}</span>
            <button
              className="h-8 w-8 p-0.5 transition-colors duration-200 hover:bg-[rgba(0,0,0,0.05)]"
              onClick={() => {
                setSelectedHouses((prev) => prev.filter((id) => id !== houseId))
              }}
            >
              <Close />
            </button>
          </p>
        )
      })}

      {/* {houseSelectOptions.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            className="w-10 py-1 text-center text-2xl leading-none text-gray-400 transition-colors duration-200 hover:text-white"
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
                    setSelectedHouses((prev) => [
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
      )} */}
    </div>
  )
}

export default HousesPillsSelector
