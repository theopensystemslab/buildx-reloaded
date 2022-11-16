import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useCallback } from "react"
import { Intersection } from "three"
import { proxy, useSnapshot } from "valtio"
import * as z from "zod"
import { setCameraEnabled } from "../camera"
import { EditMode } from "../siteCtx"
import { setTransients } from "../transients"

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
        handleIdentifier: userData as HandleIdentifier,
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
