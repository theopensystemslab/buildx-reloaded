import { invalidate, ThreeEvent } from "@react-three/fiber"
import { Handler, useGesture, UserHandlers } from "@use-gesture/react"
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
import { insertVanillaColumn } from "../helpers/layouts"
import {
  getHouseGroupColumns,
  handleColumnGroupParentQuery,
  rootHouseGroupParentQuery,
} from "../helpers/sceneQueries"
import {
  GridGroupUserData,
  HouseRootGroupUserData,
  StretchHandleMeshUserData,
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

export const usePointerUpListener = (f: () => void) =>
  useEvent(GestureEventType.Enum.POINTER_UP, () => f())

export const dispatchPointerUp = () =>
  dispatchEvent(new CustomEvent(GestureEventType.Enum.POINTER_UP))

const useGestures = (rootRef: RefObject<Group>) => {
  // const firstGestureDataRef = useRef<{
  //   gestureTarget: Object3D
  //   gestureTargetHouseGroup: Group
  //   point: Vector3
  // } | null>(null)

  // const stretchDragGroup = useRef<Group | null>(null)

  const stretchData = useRef<{
    handleObject: Object3D
    houseGroup: Group
    handleGroup: Group
    point0: Vector3
    handleGroupPos0: Vector3
    lastDistance: number
    columnsAddedToEnd: number
  } | null>(null)

  // we could pre-process each gate

  const onDragStretch: Handler<"drag", ThreeEvent<PointerEvent>> = async ({
    first,
    last,
    event,
    event: { object, point },
  }) => {
    switch (true) {
      case first: {
        setCameraControlsEnabled(false)
        const handleGroup = handleColumnGroupParentQuery(object)
        const houseGroup = rootHouseGroupParentQuery(object)
        stretchData.current = {
          handleObject: object,
          houseGroup,
          handleGroup,
          handleGroupPos0: handleGroup.position.clone(),
          point0: point,
          lastDistance: 0,
          columnsAddedToEnd: 0,
        }
        dispatchPointerDown({ point, object })
        break
      }
      case !first && !last: {
        if (!stretchData.current) throw new Error("first didn't set first")

        const {
          handleGroup,
          handleGroupPos0,
          point0,
          houseGroup,
          handleObject,
          lastDistance,
          columnsAddedToEnd,
        } = stretchData.current

        const { direction, axis } =
          handleObject.userData as StretchHandleMeshUserData

        switch (axis) {
          case "z":
            switch (direction) {
              case 1: {
                const vanillaColumnLength = (
                  houseGroup.userData as HouseRootGroupUserData
                ).vanillaColumn.length

                const [x1, z1] = pointer.xz
                const distanceVector = new Vector3(x1, 0, z1).sub(point0)
                distanceVector.applyAxisAngle(
                  new Vector3(0, 1, 0),
                  -houseGroup.rotation.y
                )
                const distance = distanceVector.z

                handleGroup.position.set(0, 0, handleGroupPos0.z + distance)

                // maybe we want to oper on the house group columns doodah itself

                // and then constantly be computing whether we want to add or subtract

                // so we're tracking the next gate up or down

                // probably want to just set visible false and turn off raycasting
                // when we delete columns

                // let's work on adding some first

                // gate 1 = z'end + vanillaColumnLength

                switch (true) {
                  case distance > lastDistance: {
                    if (distance > vanillaColumnLength * columnsAddedToEnd) {
                      insertVanillaColumn(houseGroup, 1)()
                      stretchData.current.columnsAddedToEnd++
                    }
                    break
                  }
                  case distance < lastDistance: {
                    if (distance < vanillaColumnLength * columnsAddedToEnd) {
                      console.log("going down")
                    }
                    // if (
                    //   distance <
                    //   vanillaColumnLength * columnsDelta + vanillaColumnLength
                    // ) {
                    //   stretchData.current.columnsDelta++
                    // }
                  }
                }
                stretchData.current.lastDistance = distance

                // gates on err...

                // vanilla column length up

                // existing column length down
              }
            }
        }

        break
      }
      case last: {
        if (stretchData.current === null)
          throw new Error("stretchData.current null unexpectedly")
        dispatchPointerUp()
        stretchData.current = null
        setCameraControlsEnabled(true)
        break
      }
    }
  }

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
    onDrag: (state) => {
      const stretch = true
      switch (true) {
        case stretch: {
          onDragStretch(state)
          break
        }
      }

      invalidate()

      // pipe(
      //   event.intersections,
      //   A.head,
      //   O.map((ix0) => {
      //     event.stopPropagation()

      //     const { point, object } = ix0

      //     if (first) {
      //       setCameraControlsEnabled(false)
      //       const [x, z] = pointer.xz
      //       const y = pointer.y
      //       pointerZeroRef.current = { x, y, z }
      //       lastPointerRef.current = { x, y, z }
      //       gestureTargetRef.current = object
      //       dispatchPointerDown({ point, object: gestureTargetRef.current })
      //     } else if (last) {
      //       dispatchPointerUp({ point, object: gestureTargetRef.current! })
      //       pointerZeroRef.current = null
      //       lastPointerRef.current = null
      //       gestureTargetRef.current = null
      //       setCameraControlsEnabled(true)
      //     } else {
      //       const userData = gestureTargetRef.current?.userData as UserData

      //       switch (userData.type) {
      //         case UserDataTypeEnum.Enum.StretchHandleMesh: {
      //           const { houseId, direction, axis } =
      //             userData as StretchHandleMeshUserData

      //           const maybeHouseGroup = rootHouseGroupQuery(rootRef, houseId)

      //           pipe(
      //             maybeHouseGroup,
      //             O.map((houseGroup) => {
      //               if (lastPointerRef.current === null) return

      //               const [x1, z1] = pointer.xz
      //               const y1 = pointer.y

      //               const { x: x0, y: y0, z: z0 } = lastPointerRef.current

      //               const delta = new Vector3(
      //                 x1 - x0,
      //                 y1 - y0,
      //                 z1 - z0
      //               ).applyAxisAngle(
      //                 new Vector3(0, 1, 0),
      //                 -houseGroup.rotation.y
      //               )

      //               switch (axis) {
      //                 case "z":
      //                   gestureTargetRef.current!.position.z += delta.z
      //                   // object.position.lerp(
      //                   //   new Vector3(0, 0, object.position.z + delta.z),
      //                   //   0.1
      //                   // )

      //                   switch (direction) {
      //                     case 1:
      //                       break
      //                     case -1:
      //                   }

      //                   break
      //                 case "x":
      //                   break
      //               }

      //               lastPointerRef.current = { x: x1, y: y1, z: z1 }
      //             })
      //           )

      //           break
      //         }
      //       }
      //     }

      //     invalidate()
      //   })
      // )
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
        // object: { userData },
      } = intersections[0]

      // if (object.parent?.parent) {
      //   const objects = object.parent.parent.children.flatMap((x) => x.children)
      //   dispatchOutline({
      //     objects,
      //   })
      // }

      if (hovering) {
        document.body.style.cursor = "grab"
      }

      if (object.userData.type !== UserDataTypeEnum.Enum.ElementMesh) return

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
