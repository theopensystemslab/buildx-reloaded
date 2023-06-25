import React, { useEffect } from "react"
import { IndexedModel, IndexedModule } from "../../../db/systems"
import { House } from "../../../db/user"
import {
  dispatchComputeLayoutEvent,
  useHouseLayoutEvents,
} from "../../../workers/systems"

type Props = {
  house: House
  modules: IndexedModule[]
  models: Record<string, IndexedModel[]>
}

const ProppedHouse = (props: Props) => {
  const {
    house: { id: houseId, systemId, dnas },
  } = props

  useEffect(() => {
    dispatchComputeLayoutEvent({ houseId, systemId, dnas })
  }, [dnas, houseId, systemId])

  useHouseLayoutEvents(houseId, (layout) => {
    // console.log(
    //   JSON.stringify(
    //     layout.map(({ columnIndex, gridGroups, length, z }) => ({
    //       columnIndex,
    //       length,
    //       z,
    //       gridGroups: gridGroups.map(
    //         ({ length, levelIndex, levelType, modules, y }) => ({
    //           length,
    //           levelIndex,
    //           levelType,
    //           y,
    //           modules: modules.map(({ gridGroupIndex, z }) => ({
    //             gridGroupIndex,
    //             z,
    //           })),
    //         })
    //       ),
    //     }))
    //   )
    // )
  })

  return <group name={houseId}></group>
}

export default ProppedHouse
