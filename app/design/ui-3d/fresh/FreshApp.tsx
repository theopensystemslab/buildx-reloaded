import { invalidate, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { nanoid } from "nanoid"
import { useEffect, useRef } from "react"
import { useKey } from "react-use"
import { Group, Vector3 } from "three"
import layoutsDB from "../../../db/layouts"
import userDB, { House } from "../../../db/user"
import { A, O, R } from "../../../utils/functions"
import { useSubscribe } from "../../../utils/hooks"
import { floor, PI } from "../../../utils/math"
import { isMesh, yAxis } from "../../../utils/three"
import { openMenu } from "../../state/menu"
import scope, { ScopeItem } from "../../state/scope"
import settings from "../../state/settings"
import siteCtx, { downMode, SiteCtxModeEnum } from "../../state/siteCtx"
import { updateEverything } from "./dimensions"
import {
  dispatchAddHouse,
  useAddHouseIntentListener,
  useAddHouseListener,
  useDeleteHouseListener,
} from "./events/houses"
import { dispatchOutline } from "./events/outlines"
import {
  createHouseGroup,
  insertVanillaColumn,
  subtractPenultimateColumn,
} from "./helpers"
import getStretchXPreviews from "./stretchXPreviews"
import { UserData, UserDataTypeEnum } from "./userData"

const liveHouses: Record<string, Group> = {}
const stretchXHouses: Record<string, Record<string, Group>> = {}

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  const cleanup = () => {
    rootRef.current?.clear()
  }

  const addHouse = async (house: House) => {
    if (!rootRef.current) return

    const { id: houseId, systemId, dnas, friendlyName } = house

    const houseGroup = await createHouseGroup({
      systemId,
      houseId,
      dnas,
      friendlyName,
    })

    rootRef.current.add(houseGroup)
    liveHouses[houseId] = houseGroup

    // getStretchXPreviews(houseGroup).then((x) => {
    //   console.log(x, `hi`)
    // })

    // stretchXHouses[houseId] = getStretchXPreviews(houseGroup)
    // (stretchXHouses)

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

    const target = rootRef.current.children.find((x) => x.userData.id === id)

    if (target) {
      rootRef.current.remove(target)
      userDB.houses.delete(id)
    }

    invalidate()
  })

  const getHouseGroups = () =>
    (rootRef.current?.children ?? []).filter(
      (x) => x.userData.type === UserDataTypeEnum.Enum.HouseRootGroup
    ) as Group[]

  useKey("z", () => {
    for (let houseGroup of getHouseGroups()) {
      insertVanillaColumn(houseGroup, 1)
      updateEverything(houseGroup)
    }
  })

  useKey("Z", () => {
    for (let houseGroup of getHouseGroups()) {
      insertVanillaColumn(houseGroup, -1)
      updateEverything(houseGroup)
    }
  })

  // stretch width +
  useKey("x", () => {})

  // stretch width -
  useKey("X", () => {})

  useKey("d", () => {
    for (let houseGroup of getHouseGroups()) {
      subtractPenultimateColumn(houseGroup, 1)
      updateEverything(houseGroup)
    }
  })

  useKey("D", () => {
    for (let houseGroup of getHouseGroups()) {
      subtractPenultimateColumn(houseGroup, -1)
      updateEverything(houseGroup)
    }
  })

  useKey("t", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.position.add(new Vector3(1, 0, 1))
      updateEverything(houseGroup)
    }
  })
  useKey("T", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.position.add(new Vector3(-1, 0, -1))
      updateEverything(houseGroup)
    }
  })

  useKey("r", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.rotateOnAxis(yAxis, PI / 8)
      updateEverything(houseGroup)
    }
  })

  useKey("R", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.rotateOnAxis(yAxis, -PI / 8)
      updateEverything(houseGroup)
    }
  })

  liveQuery(() => layoutsDB.altSectionTypeLayouts.toArray()).subscribe(
    (data) => {
      for (const { houseId, altSectionTypeLayouts } of data) {
        // CONT
        // this needs to .clone(false) on the house group first
        // then fill said house group with the layout
        // ---
        // maybe we want to do this so that createHouseGroup uses this also?
        // and then we'd want to modify the
        stretchXHouses[houseId] = pipe(
          altSectionTypeLayouts,
          R.map((x) => {
            // yeah you need something that's gonna turn the layout into a scene graph
            const phonyHouseGroup = createHouseGroup()
          })
        )
      }
    }
  )

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

      // if (object.parent?.parent) {
      //   const objects = object.parent.parent.children.flatMap((x) => x.children)
      //   dispatchOutline({
      //     objects,
      //   })
      // }

      switch (siteCtx.mode) {
        case SiteCtxModeEnum.Enum.SITE:
          if (object.parent?.parent?.parent?.parent) {
            const objects = object.parent.parent.parent.parent.children.flatMap(
              (x) =>
                x.children.flatMap((y) => y.children.flatMap((z) => z.children))
            )
            dispatchOutline({
              objects,
            })
          }
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
    onDoubleClick: ({ event, event: { intersections } }) => {
      event.stopPropagation()

      if (intersections.length === 0) return

      const { object } = intersections[0]

      const userData: UserData = object.userData as UserData

      switch (userData.type) {
        case UserDataTypeEnum.Enum.ElementMesh:
          const houseId =
            object.parent?.parent?.parent?.parent?.userData.houseId
          const levelIndex = object.parent?.parent?.userData.levelIndex
          if (houseId && levelIndex) downMode({ houseId, levelIndex })
      }

      // if (userData) {
      //   if (userData?.identifier?.houseId) {
      //     downMode({ ...userData.identifier })
      //   }
      // }

      invalidate()
    },
  })

  useSubscribe(
    settings.verticalCuts,
    () => {
      const { width, length } = settings.verticalCuts
      const { levelIndex } = siteCtx

      rootRef.current?.traverseVisible((o3) => {
        const userData = o3.userData as UserData

        switch (userData.type) {
          case UserDataTypeEnum.Enum.ElementMesh:
            // console.log(userData)
            break
          case UserDataTypeEnum.Enum.HouseRootGroup:
            // TypeScript knows that userData is of type HouseModuleGroupUserData in this block
            // console.log(userData.length) // This is valid
            // console.log(userData.houseId) // TypeScript error, houseId doesn't exist on HouseModuleGroupUserData
            break
        }
      })
      // Object.values(elementMaterials.current).forEach((material) => {
      //   material.clippingPlanes = [
      //     width ? [clippingPlaneZ] : [],
      //     levelIndex !== null ? [clippingPlaneY] : [],
      //     length ? [clippingPlaneX] : [],
      //   ].flat()
      // })
      invalidate()
    },
    true
  )

  return (
    <group ref={rootRef} {...bindAll()}>
      {/* <XZPlane />
      <YPlane /> */}
    </group>
  )
}

export default FreshApp
