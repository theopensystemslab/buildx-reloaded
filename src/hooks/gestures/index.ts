import { stretchWidthRaw } from "@/ui-3d/grouped/stretchWidth/StretchWidth"
import { A, O } from "@/utils/functions"
import { useSubscribeKey } from "@/utils/hooks"
import { isMesh, useRotations } from "@/utils/three"
import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useSnapshot } from "valtio"
import { setCameraEnabled } from "../camera"
import { getHouseCenter } from "../dimensions"
import globals from "../globals"
import { openMenu } from "../menu"
import { setPreviews } from "../previews"
import scope from "../scope"
import siteCtx, { downMode, EditModeEnum } from "../siteCtx"
import { setStretchLength, stretchLengthRaw } from "../transients/stretchLength"
import {
  preTransformsTransients,
  setTransforms,
} from "../transients/transforms"
import dragProxy, { Drag, StretchHandleIdentifier } from "./drag"

export const useDragHandler = () => {
  const { rotateV2, unrotateV2 } = useRotations()

  useSubscribeKey(dragProxy, "drag", () => {
    if (dragProxy.drag === null || dragProxy.start === null) return
    const {
      start: {
        identifier,
        identifier: { houseId, identifierType },
        point: { x: x0, y: y0, z: z0 },
      },
      drag: {
        point: { x: x1, y: y1, z: z1 },
      },
    } = dragProxy
    switch (identifierType) {
      case "HOUSE_ELEMENT": {
        preTransformsTransients[houseId] = {
          position: {
            dx: x1 - x0,
            dy: 0,
            dz: z1 - z0,
          },
        }
        return
      }
      case "ROTATE_HANDLE": {
        const { x: cx, z: cz } = getHouseCenter(houseId)
        const angle0 = Math.atan2(cz - z0, cx - x0)
        const angle = Math.atan2(cz - z1, cx - x1)
        preTransformsTransients[houseId] = {
          rotation: -(angle - angle0),
        }
        return
      }
      case "STRETCH_HANDLE": {
        const [distanceX, distanceZ] = unrotateV2(houseId, [x1 - x0, z1 - z0])
        const [dx, dz] = rotateV2(houseId, [0, distanceZ])

        const { direction = 1, axis } = identifier as StretchHandleIdentifier

        if (axis === "z") {
          stretchLengthRaw[houseId] = {
            direction,
            distance: distanceZ,
            dx,
            dz,
          }
        }

        if (axis === "x") {
          stretchWidthRaw[houseId] = {
            direction,
            distance: distanceX,
            dx,
            dz,
          }
        }
      }
    }
  })

  useSubscribeKey(dragProxy, "end", () => {
    if (dragProxy.end) {
      setTransforms()
      setStretchLength()
      setPreviews()
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

        if (identifier) {
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
        }
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
