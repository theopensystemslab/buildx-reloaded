import { invalidate, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { A, O } from "../../../../utils/functions"
import { isMesh } from "../../../../utils/three"
import { openMenu } from "../../../state/menu"
import scope, { ScopeItem } from "../../../state/scope"
import siteCtx, {
  downMode,
  SiteCtxMode,
  SiteCtxModeEnum,
  useModeChangeListener,
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
import useOnDragStretch from "./stretch"

const useGestures = () => {
  const onDragStretch = useOnDragStretch()
  const onDragMove = useOnDragMove()
  const onDragRotate = useOnDragRotate()

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

      const stretch =
        stretchModes.includes(siteCtx.mode) &&
        type === UserDataTypeEnum.Enum.StretchHandleMesh

      const move = !stretch && type === UserDataTypeEnum.Enum.ElementMesh

      const rotate = !stretch && type === UserDataTypeEnum.Enum.RotateHandleMesh

      switch (true) {
        case stretch: {
          onDragStretch(state)
          break
        }
        case move: {
          onDragMove(state)
          break
        }
        case rotate: {
          onDragRotate(state)
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
