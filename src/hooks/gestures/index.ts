import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useSnapshot } from "valtio"
import { useSubscribeKey } from "../../utils/hooks"
import { useRotations } from "../../utils/three"
import { setCameraEnabled } from "../camera"
import { getHouseCenter } from "../dimensions"
import globals from "../globals"
import { openMenu } from "../menu"
import scope from "../scope"
import siteCtx, { EditModeEnum, enterBuildingMode } from "../siteCtx"
import { setStretch, stretchLengthRaw } from "../transients/stretch"
import {
  preTransformsTransients,
  setTransforms,
} from "../transients/transforms"
import { HandleIdentifier } from "./drag/handles"
import dragProxy, { Drag } from "./drag/proxy"

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
      case "element":
        preTransformsTransients[houseId] = {
          position: {
            dx: x1 - x0,
            dy: 0,
            dz: z1 - z0,
          },
        }
        return
      case "handle":
        const { editMode, side } = identifier as HandleIdentifier
        switch (editMode) {
          case EditModeEnum.Enum.MOVE_ROTATE:
            const { x: cx, z: cz } = getHouseCenter(houseId)
            const angle0 = Math.atan2(cz - z0, cx - x0)
            const angle = Math.atan2(cz - z1, cx - x1)
            preTransformsTransients[houseId] = {
              rotation: -(angle - angle0),
            }
            return
          case EditModeEnum.Enum.STRETCH:
            const [, distance] = unrotateV2(houseId, [x1 - x0, z1 - z0])
            const [dx, dz] = rotateV2(houseId, [0, distance])

            stretchLengthRaw[houseId] = {
              side,
              dx,
              dz,
              distance,
            }
        }
        return
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
      if (intersections.length === 0) return
      const {
        object: { userData },
      } = intersections[0]
      scope.selected = {
        ...userData.identifier,
      }
      openMenu(pageX, pageY)
    },
    onHover: ({ event: { intersections } }) => {
      if (intersections.length === 0) return
      const {
        object: { userData },
      } = intersections[0]
      scope.hovered = {
        ...userData.identifier,
      }
    },
    onDoubleClick: ({ event, event: { intersections } }) => {
      event.stopPropagation()

      if (intersections.length === 0) return
      const {
        object: { userData },
      } = intersections[0]

      if (userData) {
        if (userData?.identifier?.houseId)
          enterBuildingMode(userData.identifier.houseId)
      }
    },
  })

export const useDragStart = () => {
  const { start } = useSnapshot(dragProxy)

  return start
}
