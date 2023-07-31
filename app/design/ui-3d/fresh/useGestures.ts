import { invalidate, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { A, O } from "../../../utils/functions"
import { useSubscribeKey } from "../../../utils/hooks"
import { isMesh } from "../../../utils/three"
import { setCameraEnabled } from "../../state/camera"
import { dispatchMoveHouseIntent } from "../../state/events/moveRotate"
import dragProxy, { Drag } from "../../state/gestures/drag"
import { openMenu } from "../../state/menu"
import pointer from "../../state/pointer"
import scope, { ScopeItem } from "../../state/scope"
import siteCtx, {
  downMode,
  EditModeEnum,
  SiteCtxModeEnum,
} from "../../state/siteCtx"
import { dispatchOutline } from "./events/outlines"
import {
  ElementMeshUserData,
  GridGroupUserData,
  HouseRootGroupUserData,
  RotateHandleMeshUserData,
  StretchHandleMeshUserData,
  UserDataTypeEnum,
} from "./userData"

const useGestures = () => {
  return useGesture<{
    drag: ThreeEvent<PointerEvent>
    hover: ThreeEvent<PointerEvent>
    onContextMenu: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
    onDoubleClick: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
  }>({
    onDrag: ({
      first,
      last,
      event,
      event: {
        intersections: [
          {
            object: { userData },
            point: intersectionPoint,
          },
        ],
      },
    }) => {
      const [x, z] = pointer.xz
      const y = pointer.y

      // DISPATCH DRAGS INSTEAD OF PROXYING?

      // const drag: Drag = {
      //   userData,
      //   point: { x, y, z },
      // }

      // onClick here
      if (first) {
        event.stopPropagation()
        setCameraEnabled(false)
        // XZ and Y planes should subscribe here to jump to right place

        switch (userData.type as UserDataTypeEnum) {
          case UserDataTypeEnum.Enum.ElementMesh:
            const {} = userData as ElementMeshUserData
            break
          case UserDataTypeEnum.Enum.StretchHandleMesh:
            const {} = userData as StretchHandleMeshUserData
            break
          case UserDataTypeEnum.Enum.RotateHandleMesh:
            const {} = userData as RotateHandleMeshUserData
            break
        }

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

        //   dragProxy.start = {
        //     identifier,
        //     point: intersectionPoint,
        //   }
        //   dragProxy.end = false
        // }
      } else if (last) {
        // event.stopPropagation()
        // dragProxy.end = true
        // setCameraEnabled(true)
      } else {
        // dragProxy.drag = drag
      }
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
