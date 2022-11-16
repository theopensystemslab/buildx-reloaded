import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useCallback } from "react"
import { Intersection } from "three"
import { proxy, useSnapshot } from "valtio"
import * as z from "zod"
import { useSubscribeKey } from "../../utils/hooks"
import { setCameraEnabled } from "../camera"
import { EditMode, EditModeEnum } from "../siteCtx"
import { setTransients, transients } from "../transients"

export const HandleSideEnum = z.enum(["FRONT", "BACK", "LEFT", "RIGHT"])

export type HandleSide = z.infer<typeof HandleSideEnum>

type HandleIdentifier = {
  houseId: string
  editMode: EditMode
  side: HandleSide
}

export type HandleDragEvent = {
  handleIdentifier: HandleIdentifier
  point: V3
}

type HandleDragEvents = {
  dragStart: HandleDragEvent | null
  drag: HandleDragEvent | null
  drop: boolean
}

const handleDragEvents = proxy<HandleDragEvents>({
  drag: null,
  dragStart: null,
  drop: true,
})

export const useHandleDragFunctions = () => {
  const onDragStart = useCallback(
    ({ object: { userData }, point }: Intersection) => {
      setCameraEnabled(false)
      handleDragEvents.dragStart = {
        handleIdentifier: userData.handleIdentifier as HandleIdentifier,
        point,
      }
      handleDragEvents.drop = false
    },
    []
  )

  const onDragEnd = useCallback((_intersection: Intersection) => {
    setCameraEnabled(true)
    setTransients()
    handleDragEvents.drag = null
    handleDragEvents.dragStart = null
    handleDragEvents.drop = true
  }, [])

  return { onDragStart, onDragEnd }
}

export const useHandleDragHandlers = (): any => {
  useSubscribeKey(handleDragEvents, "drag", () => {
    if (handleDragEvents.dragStart === null || handleDragEvents.drag === null) {
      return
    }

    const {
      dragStart: {
        point: { x: x0, z: z0 },
        handleIdentifier: { houseId, editMode },
        // element: { houseId },
      },
      drag: {
        point: { x: x1, z: z1 },
      },
    } = handleDragEvents

    switch (editMode) {
      case EditModeEnum.Enum.MOVE_ROTATE:
        const angle0 = Math.atan2(z0, x0)
        const angle = Math.atan2(z1, x1)
        transients[houseId] = {
          rotation: angle - angle0,
        }
        return
      case EditModeEnum.Enum.STRETCH:
        transients[houseId] = {
          stretchUnits: z1 - z0,
        }
        return
    }

    // updateTransientHousePositionDelta(houseId, {
    //   dx: x1 - x0,
    //   dy: 0,
    //   dz: z1 - z0,
    // })
  })
  const { onDragStart, onDragEnd } = useHandleDragFunctions()

  return useGesture<{
    hover: ThreeEvent<PointerEvent>
    drag: ThreeEvent<PointerEvent>
    onPointerDown: ThreeEvent<PointerEvent>
  }>({
    onDrag: (state) => {
      const {
        first,
        last,
        event: {
          intersections: [intersection],
        },
      } = state

      if (first) onDragStart(intersection)
      else if (last) onDragEnd(intersection)
    },
  })
}

export const useHandleDragStart = () => {
  const { dragStart } = useSnapshot(handleDragEvents)
  return dragStart
}

export const useHandleDragEvents = () => useSnapshot(handleDragEvents)

export default handleDragEvents
