import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { MutableRefObject, RefObject, useEffect } from "react"
import { useEvent } from "react-use"
import { Group, Vector3 } from "three"
import { HouseType } from "../../../../../server/data/houseTypes"
import userDB, { House } from "../../../../db/user"
import { A } from "../../../../utils/functions"
import { setVisibleAndRaycast } from "../../../../utils/three"
import { nanoid } from "nanoid"
import { floor } from "../../../../utils/math"
import { createInitialHouse } from "../helpers/layouts"

const ADD_HOUSE_INTENT_EVENT = "AddHouseIntentEvent"
const ADD_HOUSE_EVENT = "AddHouseEvent"
const DELETE_HOUSE_EVENT = "DeleteHouseEvent"

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

export const useHousesEvents = (rootRef: RefObject<Group>) => {
  const addHouse = async (house: House) => {
    if (!rootRef.current) return

    const {
      houseId: houseId,
      systemId,
      dnas,
      friendlyName,
      position,
      rotation,
      houseTypeId,
    } = house

    const houseGroup = await createInitialHouse({
      systemId,
      houseId,
      dnas,
      friendlyName,
      houseTypeId,
    })()

    houseGroup.position.set(position.x, position.y, position.z)
    houseGroup.rotation.set(0, rotation, 0)

    setVisibleAndRaycast(houseGroup)

    rootRef.current.add(houseGroup)
    // liveHouses[houseId] = houseGroup

    invalidate()

    userDB.houses.put(house)
  }

  const cleanup = () => {
    rootRef.current?.clear()
  }

  const initHouses = () => {
    userDB.houses.toArray().then((houses) => {
      pipe(houses, A.map(addHouse))
    })

    invalidate()

    return cleanup
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(initHouses, [])

  useAddHouseIntentListener(({ dnas, id: houseTypeId, systemId }) => {
    // maybe cameraGroundRaycast
    // maybe collisions

    const id = nanoid()
    const position = new Vector3(0, 0, 0)

    const getFriendlyName = () => {
      return `yo+${floor(Math.random() * 99999)}` // Object.keys(houses).length + 1
    }

    const friendlyName = getFriendlyName()

    dispatchAddHouse({
      houseId: id,
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
}
