import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { Vector3 } from "three"
import { useSnapshot } from "valtio"
import { useSubscribeKey } from "../../utils/hooks"
import { yAxis } from "../../utils/three"
import { setCameraEnabled } from "../camera"
import dimensions from "../dimensions"
import globals from "../globals"
import houses from "../houses"
import { EditModeEnum } from "../siteCtx"
import { setTransients } from "../transients/common"
import preTransients from "../transients/pre"
import { HandleIdentifier } from "./drag/handles"
import dragProxy, { Drag } from "./drag/proxy"

export const useDragHandler = () => {
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
        preTransients[houseId] = {
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
            const { x: cx, z: cz } = dimensions?.[houseId].obb.center ?? {
              x: 0,
              z: 0,
            }
            const angle0 = Math.atan2(cz - z0, cx - x0)
            const angle = Math.atan2(cz - z1, cx - x1)
            preTransients[houseId] = {
              rotation: -(angle - angle0),
            }
            return
          case EditModeEnum.Enum.STRETCH:
            const v = new Vector3(x1 - x0, 0, z1 - z0)
            v.applyAxisAngle(yAxis, -houses[houseId].rotation)

            preTransients[houseId] = {
              stretchLengthUnits: v.z,
            }
        }
        return
    }
  })

  useSubscribeKey(dragProxy, "end", () => {
    if (dragProxy.end) {
      setTransients()
      dragProxy.start = null
      dragProxy.drag = null
    }
  })
}

export const useGestures = (): any => {
  useDragHandler()

  return useGesture<{ drag: ThreeEvent<PointerEvent> }>({
    onDrag: ({
      first,
      last,
      event: {
        intersections: [
          {
            object: { userData },
            point: intersectionPoint,
          },
        ],
      },
    }) => {
      const [x, z] = globals.pointerXZ
      const y = globals.pointerY

      const drag: Drag = {
        identifier: userData.identifier,
        point: { x, y, z },
      }

      if (first) {
        setCameraEnabled(false)
        // XZ and Y planes should subscribe here to jump to right place
        dragProxy.start = {
          identifier: userData.identifier,
          point: intersectionPoint,
        }
        dragProxy.end = false
      } else if (last) {
        dragProxy.end = true
        setCameraEnabled(true)
      } else {
        dragProxy.drag = drag
      }
    },
  })
}

export const useDragStart = () => {
  const { start } = useSnapshot(dragProxy)

  return start
}
