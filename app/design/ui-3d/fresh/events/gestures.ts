import { invalidate, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { RefObject, useRef } from "react"
import { useEvent } from "react-use"
import { Group, Object3D, Vector3 } from "three"
import { z } from "zod"
import { A, O } from "../../../../utils/functions"
import { isMesh } from "../../../../utils/three"
import { setCameraControlsEnabled } from "../../../state/camera"
import { openMenu } from "../../../state/menu"
import pointer from "../../../state/pointer"
import scope, { ScopeItem } from "../../../state/scope"
import siteCtx, { downMode, SiteCtxModeEnum } from "../../../state/siteCtx"
import { rootHouseGroupQuery } from "../helpers/sceneQueries"
import {
  GridGroupUserData,
  HouseRootGroupUserData,
  StretchHandleMeshUserData,
  UserData,
  UserDataTypeEnum,
} from "../userData"
import { dispatchOutline } from "./outlines"

export const GestureEventType = z.enum(["POINTER_DOWN", "POINTER_UP"])

export type GestureEventType = z.infer<typeof GestureEventType>

export type GestureEventDetail = {
  point: V3
  object: Object3D
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
  point: V3
  object: Object3D
}

const useGestures = (rootRef: RefObject<Group>) => {
  const dragStartRef = useRef<GestureTarget | null>(null)
  const lastDragRef = useRef<V3 | null>(null)

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

          const { point, object } = ix0
          const [px, pz] = pointer.xz
          const py = pointer.y

          if (first) {
            setCameraControlsEnabled(false)
            dispatchPointerDown({ point, object })
            dragStartRef.current = { point, object }
            lastDragRef.current = point
          } else if (last) {
            setCameraControlsEnabled(true)
            dispatchPointerUp({ point, object })
          } else {
            if (!dragStartRef.current) return

            const { point: p0, object } = dragStartRef.current

            const userData = object.userData as UserData

            switch (userData.type) {
              case UserDataTypeEnum.Enum.StretchHandleMesh: {
                const { houseId, direction, axis } =
                  userData as StretchHandleMeshUserData

                const maybeHouseGroup = rootHouseGroupQuery(rootRef, houseId)

                pipe(
                  maybeHouseGroup,
                  O.map((houseGroup) => {
                    if (!lastDragRef.current) return

                    const delta = new Vector3(
                      px - lastDragRef.current.x,
                      py - lastDragRef.current.y,
                      pz - lastDragRef.current.z
                    ).applyAxisAngle(
                      new Vector3(0, 1, 0),
                      -houseGroup.rotation.y
                    )

                    switch (axis) {
                      case "z":
                        console.log(object.position)
                        object.position.add(new Vector3(0, 0, delta.z))
                        console.log(object.position, delta.z)

                        switch (direction) {
                          case 1:
                            break
                          case -1:
                        }

                        // measure vanilla column length vs. delta
                        // maybe insert or remove

                        // insertVanillaColumn(houseGroup, direction)
                        break
                      case "x":
                        break
                    }
                  })
                )

                break
              }
            }
          }

          lastDragRef.current = { x: px, y: py, z: pz }

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
