"use client"
import dynamic from "next/dynamic"
import { Fragment, useState } from "react"
import { useHouses } from "../../src/hooks/houses"
import HousesView from "./HousesView"

const HousesPillsSelector = dynamic(
  () => import("../common/HousesPillsSelector"),
  { ssr: false }
)

const BuildIndex = () => {
  const houses = useHouses()
  const [selectedHouses, setSelectedHouses] = useState<string[]>(
    Object.keys(houses)
  )

  return (
    <Fragment>
      {/* <HousePillsSelect />
      <BuildPageSubNav /> */}
      <div className="w-full h-full flex justify-center items-center">
        {/* <HousesView /> */}

        <HousesPillsSelector
          houses={houses}
          selectedHouses={selectedHouses}
          setSelectedHouses={setSelectedHouses}
        />
      </div>
    </Fragment>
  )
}

export default BuildIndex
