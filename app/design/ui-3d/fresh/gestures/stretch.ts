import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { useRef } from "react"
import { Group, Object3D, Vector3 } from "three"
import { dispatchPointerDown, dispatchPointerUp } from "./events"
import { setCameraControlsEnabled } from "../../../state/camera"
import pointer from "../../../state/pointer"
import {
  getActiveHouseUserData,
  handleColumnGroupParentQuery,
  rootHouseGroupParentQuery,
} from "../helpers/sceneQueries"
import { insertVanillaColumn } from "../helpers/stretchZ"
import { StretchHandleMeshUserData } from "../userData"

const useOnDragStretch = () => {
  const stretchDataRef = useRef<{
    handleObject: Object3D
    houseGroup: Group
    handleGroup: Group
    point0: Vector3
    handleGroupPos0: Vector3
    axis: "x" | "z"
    direction: number
    lastDistance: number
    columnsAddedToEnd: number
  } | null>(null)

  const onStretchXProgress: Handler<"drag", ThreeEvent<PointerEvent>> = () => {}

  const onStretchZProgress: Handler<"drag", ThreeEvent<PointerEvent>> = () => {
    const stretchData = stretchDataRef.current!
    const {
      handleGroup,
      handleGroupPos0,
      point0,
      houseGroup,
      axis,
      direction,
      handleObject,
      lastDistance,
      columnsAddedToEnd,
    } = stretchData

    switch (direction) {
      case -1: {
        return
      }
      case 1: {
        const [x1, z1] = pointer.xz
        const distanceVector = new Vector3(x1, 0, z1).sub(point0)
        distanceVector.applyAxisAngle(
          new Vector3(0, 1, 0),
          -houseGroup.rotation.y
        )
        const distance = distanceVector.z

        handleGroup.position.set(0, 0, handleGroupPos0.z + distance)

        // maybe we want to oper on the house group columns doodah itself

        // and then constantly be computing whether we want to add or subtract

        // so we're tracking the next gate up or down

        // probably want to just set visible false and turn off raycasting
        // when we delete columns

        // let's work on adding some first

        // gate 1 = z'end + vanillaColumnLength

        const { vanillaColumn } = getActiveHouseUserData(houseGroup)

        switch (true) {
          case distance > lastDistance: {
            if (distance > vanillaColumn.length * columnsAddedToEnd) {
              insertVanillaColumn(houseGroup, 1)()
              stretchData.columnsAddedToEnd++
            }
            break
          }
          case distance < lastDistance: {
            if (distance < vanillaColumn.length * columnsAddedToEnd) {
            }
            // if (
            //   distance <
            //   vanillaColumnLength * columnsDelta + vanillaColumnLength
            // ) {
            //   stretchData.current.columnsDelta++
            // }
          }
        }
        stretchData.lastDistance = distance

        // gates on err...

        // vanilla column length up

        // existing column length down
        return
      }
    }
  }

  const onDragStretch: Handler<"drag", ThreeEvent<PointerEvent>> = (state) => {
    const {
      first,
      last,
      event,
      event: { object, point },
    } = state

    switch (true) {
      case first: {
        setCameraControlsEnabled(false)

        const { direction, axis } = object.userData as StretchHandleMeshUserData

        switch (axis) {
          case "x":
            return
          case "z":
            const handleGroup = handleColumnGroupParentQuery(object)
            const houseGroup = rootHouseGroupParentQuery(object)
            stretchDataRef.current = {
              handleObject: object,
              houseGroup,
              handleGroup,
              handleGroupPos0: handleGroup.position.clone(),
              point0: point,
              lastDistance: 0,
              direction,
              axis,
              columnsAddedToEnd: 0,
            }
            dispatchPointerDown({ point, object })
            return
        }
      }
      case last: {
        if (stretchDataRef.current === null)
          throw new Error("stretchData.current null unexpectedly")
        dispatchPointerUp()
        stretchDataRef.current = null
        setCameraControlsEnabled(true)
        return
      }
      default: {
        if (!stretchDataRef.current)
          throw new Error(`onDragStretch first didn't set first`)

        const { axis } = stretchDataRef.current

        switch (axis) {
          case "z":
            onStretchZProgress(state)
            return
          case "x":
            onStretchXProgress(state)
            return
        }
      }
    }
  }

  return onDragStretch
}

export default useOnDragStretch
