import { invalidate, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useDebouncedCallback } from "use-debounce"
import { useSnapshot } from "valtio"
import scope from "~/design/state/scope"
import { preTransformsTransients } from "~/design/state/transients/transforms"
import { A, O } from "~/utils/functions"
import { useSubscribeKey } from "~/utils/hooks"
import { isMesh, useRotations } from "~/utils/three"
import { setCameraEnabled } from "../camera"
import { getHouseCenter } from "../dimensions"
import {
  dispatchMoveHouseIntent,
  dispatchXStretchHouseIntent,
  dispatchZStretchHouseIntent,
} from "../events"
import { openMenu } from "../menu"
import pointer from "../pointer"
import siteCtx, { downMode, EditModeEnum } from "../siteCtx"
import dragProxy, { Drag, StretchHandleIdentifier } from "./drag"

export const useDragHandler = () => {
  const { rotateV2, unrotateV2 } = useRotations()

  useSubscribeKey(
    dragProxy,
    "drag",
    () => {
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
          dispatchMoveHouseIntent({
            houseId,
            delta: {
              x: x1 - x0,
              y: 0,
              z: z1 - z0,
            },
            last: false,
          })
          return
        }
        case "ROTATE_HANDLE": {
          // dispatch event rotate house intent
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
            console.log("dispatching NORMAL")
            dispatchZStretchHouseIntent({
              houseId,
              direction,
              distance: distanceZ,
              dx,
              dz,
              last: false,
            })
          } else if (axis === "x") {
            dispatchXStretchHouseIntent({
              houseId,
              direction,
              distance: distanceX,
              dx,
              dz,
              last: false,
            })
          }
          return
        }
      }
    },
    false
  )

  useSubscribeKey(
    dragProxy,
    "end",
    () => {
      if (!dragProxy.end) return

      const cleanup = () => {
        console.log("cleaning up")
        dragProxy.start = null
        dragProxy.drag = null
        dragProxy.end = false
      }

      if (dragProxy.drag === null || dragProxy.start === null) {
        cleanup()
        return
      }

      const {
        start: {
          identifier,
          identifier: { houseId },
          point: { x: x0, z: z0 },
        },
        drag: {
          point: { x: x1, z: z1 },
        },
      } = dragProxy

      const delta = {
        x: x1 - x0,
        y: 0,
        z: z1 - z0,
      }

      if (dragProxy.end) {
        switch (siteCtx.editMode) {
          case EditModeEnum.Enum.MOVE_ROTATE:
            dispatchMoveHouseIntent({
              houseId,
              delta,
              last: true,
            })
            break
          case EditModeEnum.Enum.STRETCH:
            const [distanceX, distanceZ] = unrotateV2(houseId, [
              x1 - x0,
              z1 - z0,
            ])
            const [dx, dz] = rotateV2(houseId, [0, distanceZ])

            const { direction = 1, axis } =
              identifier as StretchHandleIdentifier

            if (axis === "z") {
              console.log("dispatching LAST")
              dispatchZStretchHouseIntent({
                houseId,
                direction,
                distance: distanceZ,
                dx,
                dz,
                last: true,
              })
            } else if (axis === "x") {
              dispatchXStretchHouseIntent({
                houseId,
                direction,
                distance: distanceX,
                dx,
                dz,
                last: true,
              })
            }
            return
          // setStretchLength()
          // setPreviews()
        }
      }

      cleanup()
    },
    false
  )
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
      const [x, z] = pointer.xz
      const y = pointer.y

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

          if (siteCtx.editMode === null) {
            siteCtx.editMode = EditModeEnum.Enum.MOVE_ROTATE
          }
          if (siteCtx.houseId !== identifier.houseId) {
            siteCtx.houseId = identifier.houseId
          }

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
      invalidate()
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

      invalidate()
    },
  })

export const useDragStart = () => {
  const { start } = useSnapshot(dragProxy)

  return start
}
