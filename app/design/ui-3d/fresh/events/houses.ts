import { invalidate } from "@react-three/fiber"
import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { nanoid } from "nanoid"
import { RefObject, useEffect } from "react"
import { useEvent } from "react-use"
import { Group, Vector3 } from "three"
import { HouseType } from "../../../../../server/data/houseTypes"
import layoutsDB from "../../../../db/layouts"
import userDB, { House } from "../../../../db/user"
import { A, O } from "../../../../utils/functions"
import { floor } from "../../../../utils/math"
import { setRaycasting } from "../../../../utils/three"
import useClippingPlaneHelpers from "../helpers/clippingPlanes"
import { createHouseTransformsGroup } from "../scene/houseTransformsGroup"
import { setSidebar } from "../../../state/settings"

const ADD_HOUSE_INTENT_EVENT = "AddHouseIntentEvent"
const ADD_HOUSE_EVENT = "AddHouseEvent"
const DELETE_HOUSE_EVENT = "DeleteHouseEvent"
const REQUEST_SCENE_EVENT = "RequestSceneEvent"

export const dispatchAddHouseIntent = (detail: HouseType) =>
  dispatchEvent(
    new CustomEvent(ADD_HOUSE_INTENT_EVENT, {
      detail,
    })
  )

export const useAddHouseIntentListener = (
  f: (eventDetail: HouseType) => void
) => useEvent(ADD_HOUSE_INTENT_EVENT, ({ detail }) => f(detail))

export const dispatchAddHouse = (detail: House) =>
  dispatchEvent(
    new CustomEvent(ADD_HOUSE_EVENT, {
      detail,
    })
  )

export const useAddHouseListener = (f: (eventDetail: House) => void) =>
  useEvent(ADD_HOUSE_EVENT, ({ detail }) => f(detail))

type DeleteHouseDetail = {
  houseId: string
}

export const dispatchDeleteHouse = (detail: DeleteHouseDetail) =>
  dispatchEvent(new CustomEvent(DELETE_HOUSE_EVENT, { detail }))

export const useDeleteHouseListener = (
  f: (eventDetail: DeleteHouseDetail) => void
) => useEvent(DELETE_HOUSE_EVENT, ({ detail }) => f(detail))

export const useRequestSceneEventListener = (rootRef: RefObject<Group>) =>
  useEvent(REQUEST_SCENE_EVENT, () => O.fromNullable(rootRef.current))

export const dispatchRequestScene = () =>
  void dispatchEvent(new CustomEvent(REQUEST_SCENE_EVENT))

export const useHousesEvents = (rootRef: RefObject<Group>) => {
  const { initClippingPlanes } = useClippingPlaneHelpers(rootRef)

  const cleanup = () => {
    rootRef.current?.clear()
  }

  useDeleteHouseListener(({ houseId }) => {
    if (!rootRef.current) return

    const target = rootRef.current.children.find((x) => {
      return x.userData.houseId === houseId
    })

    if (target) {
      rootRef.current.remove(target)
      userDB.houses.delete(houseId)
    }

    invalidate()
  })

  useRequestSceneEventListener(rootRef)
}
