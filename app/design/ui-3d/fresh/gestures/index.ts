import { invalidate, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useRef } from "react"
import { ref } from "valtio"
import { setCameraControlsEnabled } from "../../../state/camera"
import menu, { openMenu } from "../../../state/menu"
import scope from "../../../state/scope"
import siteCtx, {
  dispatchModeChange,
  getModeBools,
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
  isElementMesh,
  isRotateHandleMesh,
  isStretchHandleMesh,
  StretchHandleGroup,
  UserDataTypeEnum,
} from "../scene/userData"
import { dispatchPointerDown, dispatchPointerUp } from "./events"
import useOnDragMove from "./move"
import useOnDragRotate from "./rotate"
import useOnDragStretchX from "./stretchX"
import useOnDragStretchZ from "./stretchZ"
import { compareProps } from "../../../../utils/functions"

const useGestures = () => {
  const onDragMove = useOnDragMove()
  const onDragRotate = useOnDragRotate()

  const onDragStretchZ = useOnDragStretchZ()
  const onDragStretchX = useOnDragStretchX()

  const firstDragEventRef = useRef<ThreeEvent<PointerEvent> | null>(null)

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
      const { first, last } = state

      if (first) {
        setCameraControlsEnabled(false)
        firstDragEventRef.current = state.event
        const { point, object } = firstDragEventRef.current

        dispatchPointerDown({ point, object })
      }

      const { object, point } = firstDragEventRef.current!

      const { siteMode } = getModeBools()

      // stretch
      if (!siteMode && isStretchHandleMesh(object)) {
        const handleGroup = object.parent as StretchHandleGroup
        const {
          userData: { axis },
          visible,
        } = handleGroup

        if (axis === "z" && isStretchHandleMesh(object)) {
          if (first) onDragStretchZ.first({ handleGroup, point })
          if (!first && !last) onDragStretchZ.mid()
          if (last) onDragStretchZ.last()
        }
        if (axis === "x") {
          if (first) onDragStretchX.first({ handleGroup, point })
          if (!first && !last) onDragStretchX.mid()
          if (last) onDragStretchX.last()
        }
      }

      // move/rotate
      if (siteMode) {
        // move
        if (isElementMesh(object)) {
          onDragMove(state)
          // rotate
        } else if (isRotateHandleMesh(object)) {
          onDragRotate(state)
        }
      }

      if (last) {
        firstDragEventRef.current = null
        dispatchPointerUp()
        setCameraControlsEnabled(true)
      }

      invalidate()
    },
    onHover: ({ event: { intersections }, hovering }) => {
      if (firstDragEventRef.current || menu.open) return

      if (intersections.length === 0) {
        document.body.style.cursor = ""
        dispatchOutline({
          hoveredObjects: [],
        })
        invalidate()
        scope.hovered = null
        return
      }

      mapNearestCutIntersection(intersections, (intersection) => {
        const { object } = intersection

        switch (object.userData.type) {
          case UserDataTypeEnum.Enum.ElementMesh: {
            const scopeItem = elementMeshToScopeItem(object)

            // if building/level and this some other house exit
            if (siteCtx.houseId && scopeItem.houseId !== siteCtx.houseId) return

            if (scope.hovered) {
              if (compareProps(scope.hovered, scopeItem)) {
                return
              }
            }

            scope.hovered = ref(scopeItem)

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
      mapNearestCutIntersection(intersections, ({ object }) => {
        const scopeItem = elementMeshToScopeItem(object)
        scope.selected = ref(scopeItem)
        openMenu(pageX, pageY)
      })
    },
    onDoubleClick: ({ event, event: { intersections } }) => {
      event.stopPropagation()

      if (intersections.length === 0) return

      const {
        object,
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

          const { mode } = siteCtx

          switch (mode) {
            case SiteCtxModeEnum.Enum.SITE:
              dispatchModeChange({
                prev: mode,
                next: SiteCtxModeEnum.Enum.BUILDING,
                houseId,
              })
              dispatchOutline({
                selectedObjects: [],
              })
              break
            case SiteCtxModeEnum.Enum.BUILDING:
              if (houseId !== siteCtx.houseId) return

              dispatchModeChange({
                prev: mode,
                next: SiteCtxModeEnum.Enum.LEVEL,
                houseId,
                levelIndex,
              })
              break
          }
        }
      }

      invalidate()
    },
  }) as any
}

export default useGestures
