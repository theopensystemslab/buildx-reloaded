import React, { useState, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Close } from "~/ui/icons"
import { useHouses, useProjectData } from "@opensystemslab/buildx-core"

const HousesPillsSelector2 = ({
  selectedHouseIds,
  onSelectedHouseIdsChange,
}: {
  selectedHouseIds: string[]
  onSelectedHouseIdsChange: (newSelectedHouseIds: string[]) => void
}) => {
  const houses = useHouses()

  const selectedHouses = useMemo(
    () => houses.filter((house) => selectedHouseIds.includes(house.houseId)),
    [houses, selectedHouseIds]
  )

  const removeHouseId = (id: string) => {
    onSelectedHouseIdsChange(
      selectedHouseIds.filter((houseId) => houseId !== id)
    )
  }

  // Render the component UI
  return (
    <div>
      {selectedHouses.map((house) => (
        <div key={house.houseId}>
          {house.friendlyName}
          <button onClick={() => removeHouseId(house.houseId)}>
            <Close />
          </button>
        </div>
      ))}
    </div>
  )
}

export default HousesPillsSelector2
