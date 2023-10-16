import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { RefObject, useEffect } from "react"
import { useEvent } from "react-use"
import { Group } from "three"
import userDB, { House } from "../../../../db/user"
import { A, O } from "../../../../utils/functions"
import { setRaycasting } from "../../../../utils/three"
import { setSidebar } from "../../../state/settings"
import siteCtx, { dispatchModeChange } from "../../../state/siteCtx"
import { createHouseTransformsGroup } from "../scene/houseTransformsGroup"

const REQUEST_SCENE_EVENT = "RequestSceneEvent"

export const useRequestSceneEventListener = (rootRef: RefObject<Group>) =>
  useEvent(REQUEST_SCENE_EVENT, () => O.fromNullable(rootRef.current))

export const dispatchRequestScene = () =>
  void dispatchEvent(new CustomEvent(REQUEST_SCENE_EVENT))

export const useHousesEvents = (rootRef: RefObject<Group>) => {
  useRequestSceneEventListener(rootRef)

  const cleanup = () => {
    rootRef.current?.clear()
  }

  const addHouse = async (house: House) => {
    if (!rootRef.current) return

    const { houseId, position, rotation } = house

    const houseTransformsGroup = await createHouseTransformsGroup(house)()

    houseTransformsGroup.position.set(position.x, position.y, position.z)
    houseTransformsGroup.rotation.set(0, rotation, 0)

    setRaycasting(houseTransformsGroup, true)

    rootRef.current.add(houseTransformsGroup)

    houseTransformsGroup.userData
      .unsafeGetActiveLayoutGroup()
      .userData.updateBBs()

    invalidate()

    userDB.houses.put(house)

    dispatchModeChange({ next: siteCtx.mode })

    // initClippingPlanes(houseId)
  }

  const initHouses = () => {
    userDB.houses.toArray().then((houses) => {
      // this is new
      if (houses.length === 0) setSidebar(true)
      pipe(houses, A.map(addHouse))
    })

    invalidate()

    return cleanup
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(initHouses, [])
}
