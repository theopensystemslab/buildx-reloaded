import { invalidate, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { A, O } from "../../../../utils/functions"
import { isMesh } from "../../../../utils/three"
import { openMenu } from "../../../state/menu"
import scope, { ScopeItem } from "../../../state/scope"
import siteCtx, {
  downMode,
  SiteCtxMode,
  SiteCtxModeEnum,
} from "../../../state/siteCtx"
import { dispatchOutline } from "../events/outlines"
import {
  mapNearestCutIntersection,
  objectToHouseObjects,
  objectToIfcTagObjects,
} from "../helpers/sceneQueries"
import {
  elementMeshToScopeItem,
  GridGroupUserData,
  HouseTransformsGroupUserData,
  UserDataTypeEnum,
} from "../userData"
import useOnDragMove from "./move"
import useOnDragRotate from "./rotate"
import useOnDragStretch from "./stretchZ"

const useGestures = () => {
  const onDragStretch = useOnDragStretch()
  const onDragMove = useOnDragMove()
  const onDragRotate = useOnDragRotate()

  let stretching = false,
    moving = false,
    rotating = false

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
      const stretchModes: SiteCtxMode[] = [
        SiteCtxModeEnum.Enum.BUILDING,
        SiteCtxModeEnum.Enum.LEVEL,
      ]

      const type = state.event.object.userData?.type
      const { first, last } = state

      const stretch =
        stretching ||
        (stretchModes.includes(siteCtx.mode) &&
          type === UserDataTypeEnum.Enum.StretchHandleMesh)

      const move =
        moving || (!stretch && type === UserDataTypeEnum.Enum.ElementMesh)

      const rotate =
        rotating ||
        (!stretch && type === UserDataTypeEnum.Enum.RotateHandleMesh)

      switch (true) {
        case stretch: {
          if (first) stretching = true
          onDragStretch(state)
          if (last) stretching = false
          break
        }
        case move: {
          if (first) moving = true
          onDragMove(state)
          if (last) moving = false
          break
        }
        case rotate: {
          if (first) rotating = true
          onDragRotate(state)
          if (last) rotating = false
          break
        }
        default: {
          break
        }
      }

      invalidate()
    },
    onHover: ({ event, event: { intersections }, hovering }) => {
      event.stopPropagation()

      if (intersections.length === 0) {
        document.body.style.cursor = ""
        dispatchOutline({
          hoveredObjects: [],
        })
        invalidate()
        // scope.hovered = null
        return
      }

      mapNearestCutIntersection(intersections, (intersection) => {
        const { object } = intersection

        switch (object.userData.type) {
          case UserDataTypeEnum.Enum.ElementMesh: {
            const scopeItem = elementMeshToScopeItem(object)
            scope.hovered = scopeItem

            switch (siteCtx.mode) {
              case SiteCtxModeEnum.Enum.SITE:
                if (hovering) {
                  document.body.style.cursor = "grab"
                }
                dispatchOutline({
                  hoveredObjects: objectToHouseObjects(object),
                })
                break
              case SiteCtxModeEnum.Enum.BUILDING:
                dispatchOutline({
                  hoveredObjects: objectToIfcTagObjects(object),
                })
                // object to all of ifc tag
                break
              case SiteCtxModeEnum.Enum.LEVEL:
                // object to all of module group
                if (object.parent) {
                  dispatchOutline({ hoveredObjects: object.parent.children })
                }
                break
            }
            break
          }
          case UserDataTypeEnum.Enum.StretchHandleMesh:
          case UserDataTypeEnum.Enum.RotateHandleMesh: {
            if (hovering) {
              document.body.style.cursor = "grab"
            }
            break
          }
          default: {
            break
          }
        }
      })

      invalidate()
    },
    onClick: ({ event: { intersections } }) => {
      mapNearestCutIntersection(intersections, (intersection) => {
        const { object } = intersection
      })
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
          UserDataTypeEnum.Enum.HouseTransformsGroup
        ) {
          const { houseId } = parent.parent.parent?.parent?.parent
            ?.userData as HouseTransformsGroupUserData
          downMode({ houseId, levelIndex })
        }
      }

      invalidate()
    },
  }) as any
}

export default useGestures
