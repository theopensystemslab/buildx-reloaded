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
import {
  handleColumnGroupParentQuery,
  rootHouseGroupParentQuery,
} from "../helpers/sceneQueries"
import {
  GridGroupUserData,
  HouseRootGroupUserData,
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
  } | null>(null)

  const onDragStretch: Handler<"drag", ThreeEvent<PointerEvent>> = ({
    first,
    last,
    event,
    event: { object, point },
  }) => {
    switch (true) {
      case first: {
        setCameraControlsEnabled(false)
        const handleGroup = handleColumnGroupParentQuery(object)
        stretchData.current = {
          handleObject: object,
          houseGroup: rootHouseGroupParentQuery(object),
          handleGroup,
          handleGroupPos0: handleGroup.position.clone(),
          point0: point,
        }
        dispatchPointerDown({ point, object })
        break
      }
      case !first && !last: {
        if (!stretchData.current) throw new Error("first didn't set first")

        const { handleGroup, handleGroupPos0, point0 } = stretchData.current

        const [x, z] = pointer.xz
        const z0 = stretchData.current.point0.z
        const y = pointer.y

        // const pointerVector = new Vector3(x, y, z)

        console.log(`z - z0 = ${z - z0}`)

        stretchData.current.handleGroup.position.set(
          0,
          0,
          handleGroupPos0.z + (z - z0)
        )

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
