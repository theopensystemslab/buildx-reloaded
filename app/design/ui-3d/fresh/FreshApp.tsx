import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { nanoid } from "nanoid"
import { useEffect, useRef } from "react"
import { useKey } from "react-use"
import { Group, Vector3 } from "three"
import userDB, { House } from "../../../db/user"
import { A } from "../../../utils/functions"
import { PI } from "../../../utils/math"
import { yAxis } from "../../../utils/three"
import {
  dispatchAddHouse,
  useAddHouseIntentListener,
  useAddHouseListener,
} from "../../state/events/houses"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import {
  createHouseGroup,
  insertVanillaColumn,
  subtractPenultimateColumn,
  updateHouseDimensions,
} from "./helpers"

let houseGroups: Record<string, Group> = {}

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  const cleanup = () => {
    rootRef.current?.clear()
  }

  const addHouse = async (house: House) => {
    if (!rootRef.current) return
    const houseGroup = await createHouseGroup(house)
    rootRef.current.add(houseGroup)
    invalidate()

    userDB.houses.put(house)
    houseGroups[house.id] = houseGroup
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

  const bindAll = () => undefined as any

  useKey("z", () => {
    for (let houseGroup of Object.values(houseGroups)) {
      insertVanillaColumn(houseGroup, 1)
      updateHouseDimensions(houseGroup)
    }
  })

  useKey("Z", () => {
    for (let houseGroup of Object.values(houseGroups)) {
      insertVanillaColumn(houseGroup, -1)
      updateHouseDimensions(houseGroup)
    }
  })

  useKey("d", () => {
    for (let houseGroup of Object.values(houseGroups)) {
      subtractPenultimateColumn(houseGroup, 1)
      updateHouseDimensions(houseGroup)
    }
  })

  useKey("D", () => {
    for (let houseGroup of Object.values(houseGroups)) {
      subtractPenultimateColumn(houseGroup, -1)
      updateHouseDimensions(houseGroup)
    }
  })

  useKey("t", () => {
    for (let houseGroup of Object.values(houseGroups)) {
      houseGroup.position.add(new Vector3(1, 0, 1))
      invalidate()
    }
  })

  useKey("r", () => {
    for (let houseGroup of Object.values(houseGroups)) {
      houseGroup.rotateOnAxis(yAxis, PI / 8)
      invalidate()
    }
  })

  return (
    <group ref={rootRef} {...bindAll()}>
      {/* <XZPlane />
      <YPlane /> */}
    </group>
  )
}

export default FreshApp
