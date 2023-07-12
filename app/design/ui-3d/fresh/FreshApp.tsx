import { invalidate } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { nanoid } from "nanoid"
import { useEffect, useRef } from "react"
import { Group, Vector3 } from "three"
import userDB, { House } from "../../../db/user"
import { A } from "../../../utils/functions"
import {
  dispatchAddHouse,
  useAddHouseIntentListener,
  useAddHouseListener,
} from "../../state/events/houses"
import { createHouseGroup } from "./helpers"

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

  const addHouse = async (house: House) => {
    if (!rootRef.current) return
    const houseGroup = await createHouseGroup(house)
    rootRef.current.add(houseGroup)
    invalidate()

    userDB.houses.put(house)
  }

  const init = () => {
    userDB.houses.toArray().then((houses) => {
      pipe(houses, A.map(addHouse))
    })

    invalidate()

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

  useAddHouseListener(addHouse)

  return <group ref={rootRef} {...bindAll()}></group>
}

export default FreshApp
