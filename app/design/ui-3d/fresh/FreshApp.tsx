import { invalidate, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { nanoid } from "nanoid"
import { useEffect, useRef } from "react"
import { useKey } from "react-use"
import { Group, Vector3 } from "three"
import userDB, { House } from "../../../db/user"
import { A, O } from "../../../utils/functions"
import { floor, PI } from "../../../utils/math"
import { isMesh, yAxis } from "../../../utils/three"
import {
  dispatchAddHouse,
  useAddHouseIntentListener,
  useAddHouseListener,
  useDeleteHouseListener,
} from "./events/houses"
import { openMenu } from "../../state/menu"
import scope, { ScopeItem } from "../../state/scope"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import {
  createHouseGroup,
  insertVanillaColumn,
  subtractPenultimateColumn,
  updateHouseDimensions,
} from "./helpers"
import { dispatchOutline } from "./events/outlines"
import siteCtx, { SiteCtxModeEnum } from "../../state/siteCtx"

// let houseGroups: Record<string, Group> = {}

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
  }

  useAddHouseListener(addHouse)

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

    const getFriendlyName = () => {
      return `yo+${floor(Math.random() * 99999)}` // Object.keys(houses).length + 1
    }

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

  useDeleteHouseListener(({ id }) => {
    if (!rootRef.current) return

    console.log(`deleting id ${id}`)

    const target = rootRef.current.children.find((x) => x.userData.id === id)

    if (target) {
      rootRef.current.remove(target)
      userDB.houses.delete(id)
    }
  })

  const getHouseGroups = () => (rootRef.current?.children ?? []) as Group[]

  useKey("z", () => {
    for (let houseGroup of getHouseGroups()) {
      insertVanillaColumn(houseGroup, 1)
      updateHouseDimensions(houseGroup)
    }
  })

  useKey("Z", () => {
    for (let houseGroup of getHouseGroups()) {
      insertVanillaColumn(houseGroup, -1)
      updateHouseDimensions(houseGroup)
    }
  })

  useKey("d", () => {
    for (let houseGroup of getHouseGroups()) {
      subtractPenultimateColumn(houseGroup, 1)
      updateHouseDimensions(houseGroup)
    }
  })

  useKey("D", () => {
    for (let houseGroup of getHouseGroups()) {
      subtractPenultimateColumn(houseGroup, -1)
      updateHouseDimensions(houseGroup)
    }
  })

  useKey("t", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.position.add(new Vector3(1, 0, 1))
      invalidate()
    }
  })

  useKey("r", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.rotateOnAxis(yAxis, PI / 8)
      invalidate()
      console.log(rootRef.current)
    }
  })

  const bindAll: any = useGesture<{
    drag: ThreeEvent<PointerEvent>
    hover: ThreeEvent<PointerEvent>
    onContextMenu: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
    onDoubleClick: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
  }>({
    onHover: ({ event, event: { intersections }, hovering }) => {
      event.stopPropagation()
      if (intersections.length === 0) {
        document.body.style.cursor = ""
        dispatchOutline({
          objects: [],
        })
        invalidate()
        // scope.hovered = null
        return
      }
      const {
        object,
        eventObject,
        // object: { userData },
      } = intersections[0]

      if (object.parent?.parent) {
        const objects = object.parent.parent.children.flatMap((x) => x.children)
        dispatchOutline({
          objects,
        })
      }
      switch (siteCtx.mode) {
        case SiteCtxModeEnum.Enum.SITE:
          // if (object.parent?.parent?.parent) {
          //   const objects = object.parent.parent.parent.children.flatMap((x) =>
          //     x.children.flatMap((y) => y.children)
          //   )
          //   dispatchOutline({
          //     objects,
          //   })
          // }
          break
        case SiteCtxModeEnum.Enum.BUILDING:
          // OUTLINE COLUMN ?!
          break
        case SiteCtxModeEnum.Enum.LEVEL:
          if (object.parent) {
            dispatchOutline({ objects: object.parent.children })
          }
          break
      }

      // scope.hovered = {
      //   ...userData.identifier,
      // }

      if (hovering) {
        document.body.style.cursor = "grab"
      }

      invalidate()
    },
    onContextMenu: ({ event, event: { intersections, pageX, pageY } }) => {
      event.stopPropagation()
      pipe(
        intersections,
        A.findFirst((x) => {
          return (
            isMesh(x.object) &&
            !Array.isArray(x.object.material) &&
            x.object.material.visible
          )
        }),
        O.map(({ object: { userData } }) => {
          scope.selected = userData as ScopeItem
          openMenu(pageX, pageY)
        })
      )
    },
  })

  return (
    <group ref={rootRef} {...bindAll()}>
      {/* <XZPlane />
      <YPlane /> */}
    </group>
  )
}

export default FreshApp
