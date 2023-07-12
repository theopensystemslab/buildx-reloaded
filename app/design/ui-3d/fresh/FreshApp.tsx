import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef } from "react"
import { Group, Vector3 } from "three"
import { getHouseLayoutsKey } from "../../../db/layouts"
import userDB from "../../../db/user"
import { A, O, R } from "../../../utils/functions"
import {
  dispatchAddHouse,
  useAddHouseIntentListener,
  useAddHouseListener,
} from "../../state/events/houses"
import {
  createHouseGroup,
  getFirstHouseLayout,
  houseLayouts,
  layoutToColumns,
} from "./helpers"
import { nanoid } from "nanoid"

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  const houseGroupRefs = useRef<Group[]>([])

  // forget this for now, just useKey
  const bindAll = useGesture({
    onClick: console.log,
  }) as any

  const cleanup = () => {
    rootRef.current?.clear()
  }

  const init = () => {
    if (!rootRef.current) return

    // get houses instead

    userDB.houses.toArray().then((houses) => {
      pipe(
        houses,
        A.map(async (house) => {
          const houseGroup = await createHouseGroup(house)
          rootRef.current!.add(houseGroup)
          console.log(`added house ${house.id}`)
        })
        // A.map(({ systemId, dnas }) =>
        //   pipe(
        //     houseLayouts,
        //     R.lookup(getHouseLayoutsKey({ systemId, dnas })),
        //     O.map((layout) =>
        //       pipe(
        //         layout,
        //         layoutToColumns,
        //         A.map((columnGroup) => {
        //           rootRef.current!.add(columnGroup)
        //         })
        //       )
        //     )
        //   )
        // )
      )
    })

    return cleanup
  }

  useEffect(init, [])
  // useKey("l", insert1VanillaColumn)

  useAddHouseIntentListener(({ dnas, id: houseTypeId, systemId }) => {
    // maybe cameraGroundRaycast
    // maybe collisions

    const id = nanoid()
    const position = new Vector3(0, 0, 0)

    const getFriendlyName = () => "yo" // Object.keys(houses).length + 1

    const friendlyName = getFriendlyName()

    dispatchAddHouse({
      id,
      systemId,
      houseTypeId,
      dnas,
      position,
      friendlyName,
      modifiedMaterials: {},
      rotation: 0,
    })
  })

  useAddHouseListener(async (house) => {
    if (!rootRef.current) return
    const houseGroup = await createHouseGroup(house)
    rootRef.current.add(houseGroup)
    console.log(`added house ${house.id}`)
  })

  return <group ref={rootRef} {...bindAll()}></group>
}

export default FreshApp
