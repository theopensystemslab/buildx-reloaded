import { invalidate, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { RefObject, useRef } from "react"
import { Group } from "three"
import { A, O } from "../../../../utils/functions"
import { useSubscribeKey } from "../../../../utils/hooks"
import { isMesh } from "../../../../utils/three"
import { setCameraControlsEnabled } from "../../../state/camera"
import { dispatchMoveHouseIntent } from "../../../state/events/moveRotate"
import dragProxy, { Drag } from "../../../state/gestures/drag"
import { openMenu } from "../../../state/menu"
import pointer from "../../../state/pointer"
import scope, { ScopeItem } from "../../../state/scope"
import siteCtx, {
  downMode,
  EditModeEnum,
  SiteCtxModeEnum,
} from "../../../state/siteCtx"
import { dispatchOutline } from "./outlines"
import {
  ElementMeshUserData,
  GridGroupUserData,
  HouseRootGroupUserData,
  RotateHandleMeshUserData,
  StretchHandleMeshUserData,
  UserData,
  UserDataTypeEnum,
} from "../userData"
import { useEvent } from "react-use"
import { z } from "zod"
import { insertVanillaColumn } from "../helpers"

export const GestureEventType = z.enum(["POINTER_DOWN", "POINTER_UP"])

export type GestureEventType = z.infer<typeof GestureEventType>

export type GestureEventDetail = {
  point: V3
  userData: UserData
}

export const usePointerDownListener = (
  f: (eventDetail: GestureEventDetail) => void
) => useEvent(GestureEventType.Enum.POINTER_DOWN, ({ detail }) => f(detail))

export const dispatchPointerDown = (detail: GestureEventDetail) =>
  dispatchEvent(new CustomEvent(GestureEventType.Enum.POINTER_DOWN, { detail }))

export const usePointerUpListener = (
  f: (eventDetail: GestureEventDetail) => void
) => useEvent(GestureEventType.Enum.POINTER_UP, ({ detail }) => f(detail))

export const dispatchPointerUp = (detail: GestureEventDetail) =>
  dispatchEvent(new CustomEvent(GestureEventType.Enum.POINTER_UP, { detail }))

type GestureTarget = {
  userData: UserData
  point: V3
}

const useGestures = (rootRef: RefObject<Group>) => {
  const dragStartRef = useRef<GestureTarget | null>(null)

  return useGesture<{
    drag: ThreeEvent<PointerEvent>
    hover: ThreeEvent<PointerEvent>
    onContextMenu: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
    onDoubleClick: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
    onClick: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
  }>({
    onDrag: ({ first, last, event }) => {
      pipe(
        event.intersections,
        A.head,
        O.map((ix0) => {
          event.stopPropagation()

          const userData = ix0.object.userData as UserData
          const [x, z] = pointer.xz
          const y = pointer.y

          if (first) {
            setCameraControlsEnabled(false)
            dispatchPointerDown({ point: ix0.point, userData })
            dragStartRef.current = { userData, point: ix0.point }

            // switch (userData.type as UserDataTypeEnum) {
            //   case UserDataTypeEnum.Enum.ElementMesh:
            //     const {} = userData as ElementMeshUserData
            //     break
            //   case UserDataTypeEnum.Enum.StretchHandleMesh:
            //     const {} = userData as StretchHandleMeshUserData
            //     break
            //   case UserDataTypeEnum.Enum.RotateHandleMesh:
            //     const {} = userData as RotateHandleMeshUserData
            //     break
            // }

            // if (type) {

            //   scope.selected = {
            //     ...identifier,
            //   }

            //   if (siteCtx.editMode === null) {
            //     siteCtx.editMode = EditModeEnum.Enum.MOVE_ROTATE
            //   }
            //   if (siteCtx.houseId !== identifier.houseId) {
            //     siteCtx.houseId = identifier.houseId
            //   }

            // }
          } else if (last) {
            setCameraControlsEnabled(true)
            dispatchPointerUp({ point: { x, y, z }, userData })
          } else {
            if (!dragStartRef.current) return
            const d0 = dragStartRef.current
            const { userData, point: p0 } = d0

            switch (userData.type) {
              case UserDataTypeEnum.Enum.StretchHandleMesh:
                const delta = {
                  x: x - p0.x,
                  y: y - p0.y,
                  z: z - p0.z,
                }
                const { houseId, direction, axis } =
                  userData as StretchHandleMeshUserData

                // rootRef to house group

                switch (axis) {
                  case "z":
                    // measure vanilla column length vs. delta
                    // maybe insert or remove

                    // insertVanillaColumn(houseGroup, direction)
                    break
                  case "x":
                    break
                }

                break
              default:
                break
            }
          }

          invalidate()
        })
      )
    },
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

      const {
        object: { parent },
      } = intersections[0]

      if (parent?.parent?.userData.type === UserDataTypeEnum.Enum.GridGroup) {
        const { levelIndex } = parent.parent.userData as GridGroupUserData
        if (
          parent.parent.parent?.parent?.parent?.userData.type ===
          UserDataTypeEnum.Enum.HouseRootGroup
        ) {
          const { houseId } = parent.parent.parent?.parent?.parent
            ?.userData as HouseRootGroupUserData
          downMode({ houseId, levelIndex })
        }
      }

      invalidate()
    },
  }) as any
}

export default useGestures
