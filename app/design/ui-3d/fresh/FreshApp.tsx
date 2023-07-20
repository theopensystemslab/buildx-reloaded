import { invalidate, ThreeEvent, useFrame, useThree } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { nanoid } from "nanoid"
import { useEffect, useMemo, useRef } from "react"
import { useKey } from "react-use"
import {
  BoxGeometry,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NotEqualStencilFunc,
  Plane,
  PlaneGeometry,
  ReplaceStencilOp,
  TorusGeometry,
  Vector3,
} from "three"
import userDB, { House } from "../../../db/user"
import { A, O } from "../../../utils/functions"
import { useSubscribe } from "../../../utils/hooks"
import { floor, PI } from "../../../utils/math"
import { isMesh, yAxis } from "../../../utils/three"
import { openMenu } from "../../state/menu"
import scope, { ScopeItem } from "../../state/scope"
import settings from "../../state/settings"
import siteCtx, { downMode, SiteCtxModeEnum } from "../../state/siteCtx"
import { updateClippingPlanes, updateHouseOBB } from "./dimensions"
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
import { UserData, UserDataTypeEnum } from "./userData"
import createPlaneStencilGroup from "./util/createPlaneStencilGroup"

// let houseGroups: Record<string, Group> = {}

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  const cleanup = () => {
    rootRef.current?.clear()
  }

  const addHouse = async (house: House) => {
    const { id: houseId, systemId, dnas, friendlyName } = house
    if (!rootRef.current) return
    const houseGroup = await createHouseGroup({
      systemId,
      houseId,
      dnas,
      friendlyName,
    })
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

  // useEffect(init, [])
  // useKey("l", insert1VanillaColumn)

  const scene = useThree((t) => t.scene)

  const planes = useMemo(() => [new Plane(new Vector3(1, 0, 0), 0)], [])

  const planeObjects = useRef<Mesh[]>([])

  const test = () => {
    if (!rootRef.current) return

    const geometry = new TorusGeometry(0.4, 0.15, 220, 60)
    const object = new Group()
    scene.add(object)
    const planeGeom = new PlaneGeometry(4, 4)

    for (let i = 0; i < planes.length; i++) {
      const poGroup = new Group()
      const plane = planes[i]
      const stencilGroup = createPlaneStencilGroup(geometry, plane, i + 1)

      // plane is clipped by the other clipping planes
      const planeMat = new MeshStandardMaterial({
        color: 0xe91e63,
        metalness: 0.1,
        roughness: 0.75,
        clippingPlanes: planes.filter((p) => p !== plane),

        stencilWrite: true,
        stencilRef: 0,
        stencilFunc: NotEqualStencilFunc,
        stencilFail: ReplaceStencilOp,
        stencilZFail: ReplaceStencilOp,
        stencilZPass: ReplaceStencilOp,
      })
      const po = new Mesh(planeGeom, planeMat)
      po.onAfterRender = function (renderer) {
        renderer.clearStencil()
      }

      po.renderOrder = i + 1.1

      object.add(stencilGroup)
      poGroup.add(po)
      planeObjects.current.push(po)
      scene.add(poGroup)
    }

    const material = new MeshStandardMaterial({
      color: 0xffc107,
      metalness: 0.1,
      roughness: 0.75,
      clippingPlanes: planes,
      clipShadows: true,
      shadowSide: DoubleSide,
    })

    // add the color
    const clippedColorFront = new Mesh(geometry, material)
    clippedColorFront.castShadow = true
    clippedColorFront.renderOrder = 6
    object.add(clippedColorFront)
  }

  useEffect(test, [planes, scene])

  useFrame(() => {
    for (let i = 0; i < planeObjects.current.length; i++) {
      const plane = planes[i]
      const po = planeObjects.current[i]
      plane.coplanarPoint(po.position)
      po.lookAt(
        po.position.x - plane.normal.x,
        po.position.y - plane.normal.y,
        po.position.z - plane.normal.z
      )
    }
  })

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
  })

  const getHouseGroups = () =>
    (rootRef.current?.children ?? []).filter(
      (x) => x.userData.type === UserDataTypeEnum.Enum.HouseRootGroup
    ) as Group[]

  useKey("z", () => {
    for (let houseGroup of getHouseGroups()) {
      insertVanillaColumn(houseGroup, 1)
    }
  })

  useKey("Z", () => {
    for (let houseGroup of getHouseGroups()) {
      insertVanillaColumn(houseGroup, -1)
    }
  })

  useKey("d", () => {
    for (let houseGroup of getHouseGroups()) {
      subtractPenultimateColumn(houseGroup, 1)
    }
  })

  useKey("D", () => {
    for (let houseGroup of getHouseGroups()) {
      subtractPenultimateColumn(houseGroup, -1)
    }
  })

  useKey("t", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.position.add(new Vector3(1, 0, 1))
      updateHouseOBB(houseGroup)
      updateClippingPlanes(houseGroup)
      invalidate()
    }
  })
  useKey("T", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.position.add(new Vector3(-1, 0, -1))
      updateHouseOBB(houseGroup)
      updateClippingPlanes(houseGroup)
      invalidate()
    }
  })

  useKey("r", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.rotateOnAxis(yAxis, PI / 8)
      houseGroup.updateMatrix()
      updateHouseOBB(houseGroup)
      updateClippingPlanes(houseGroup)
      invalidate()
    }
  })

  useKey("R", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.rotateOnAxis(yAxis, -PI / 8)
      houseGroup.updateMatrix()
      updateHouseOBB(houseGroup)
      updateClippingPlanes(houseGroup)
      invalidate()
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
