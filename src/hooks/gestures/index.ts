import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useSnapshot } from "valtio"
import { A, O } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import { isMesh } from "../../utils/three"
import { setCameraEnabled } from "../camera"
import globals from "../globals"
import { openMenu } from "../menu"
import scope from "../scope"
import siteCtx, { downMode, EditModeEnum } from "../siteCtx"
import { setStretch } from "../transients/stretchLength"
import {
  preTransformsTransients,
  setTransforms,
} from "../transients/transforms"
import dragProxy, { Drag } from "./drag/proxy"

export const useDragHandler = () => {
  useSubscribeKey(dragProxy, "drag", () => {
    if (dragProxy.drag === null || dragProxy.start === null) return
    const {
      start: {
        identifier: { houseId },
        point: { x: x0, y: y0, z: z0 },
      },
      drag: {
        point: { x: x1, y: y1, z: z1 },
      },
    } = dragProxy

    preTransformsTransients[houseId] = {
      position: {
        dx: x1 - x0,
        dy: 0,
        dz: z1 - z0,
      },
    }
  })

  useSubscribeKey(dragProxy, "end", () => {
    if (dragProxy.end) {
      setTransforms()
      setStretch()
      dragProxy.start = null
      dragProxy.drag = null
    }
  })
}

export const useGestures = (): any =>
  useGesture<{
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
            object: {
              userData: { identifier },
            },
            point: intersectionPoint,
          },
        ],
      },
    }) => {
      const [x, z] = globals.pointerXZ
      const y = globals.pointerY

      const drag: Drag = {
        identifier,
        point: { x, y, z },
      }

      // onClick here
      if (first) {
        event.stopPropagation()
        setCameraEnabled(false)
        // XZ and Y planes should subscribe here to jump to right place

        scope.selected = {
          ...identifier,
        }

        if (siteCtx.editMode === null)
          siteCtx.editMode = EditModeEnum.Enum.MOVE_ROTATE
        if (siteCtx.houseId !== identifier.houseId)
          siteCtx.houseId = identifier.houseId

        dragProxy.start = {
          identifier,
          point: intersectionPoint,
        }
        dragProxy.end = false
      } else if (last) {
        event.stopPropagation()
        dragProxy.end = true
        setCameraEnabled(true)
      } else {
        dragProxy.drag = drag
      }
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
          scope.selected = {
            ...userData.identifier,
          }
          openMenu(pageX, pageY)
        })
      )
    },
    onHover: ({ event: { intersections }, hovering }) => {
      if (intersections.length === 0) {
        document.body.style.cursor = ""
        scope.hovered = null
        return
      }
      const {
        object: { userData },
      } = intersections[0]
      scope.hovered = {
        ...userData.identifier,
      }
      if (hovering) {
        document.body.style.cursor = "grab"
      }
    },
    onDoubleClick: ({ event, event: { intersections } }) => {
      event.stopPropagation()

      if (intersections.length === 0) return
      const {
        object: { userData },
      } = intersections[0]

      if (userData) {
        if (userData?.identifier?.houseId) {
          downMode({ ...userData.identifier })
        }
      }
    },
  })

export const useDragStart = () => {
  const { start } = useSnapshot(dragProxy)

  return start
}
