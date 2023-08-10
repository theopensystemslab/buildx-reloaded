import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Group, Object3D, Vector3 } from "three"
import { dispatchPointerDown, dispatchPointerUp } from "./events"
import { A, O } from "../../../../utils/functions"
import { setCameraControlsEnabled } from "../../../state/camera"
import pointer from "../../../state/pointer"
import scope from "../../../state/scope"
import { updateIndexedHouseTransforms } from "../dimensions"
import { dispatchOutline } from "../events/outlines"
import {
  objectToHouseObjects,
  traverseDownUntil,
  traverseUpUntil,
} from "../helpers/sceneQueries"
import { elementMeshToScopeItem, UserDataTypeEnum } from "../userData"

const useOnDragMove = () => {
  const moveData = useRef<{
    lastPoint: Vector3
    houseObject: Group
  } | null>(null)

  const onDragMove: Handler<"drag", ThreeEvent<PointerEvent>> = (state) => {
    const {
      first,
      last,
      event: { intersections, stopPropagation },
    } = state

    stopPropagation()

    switch (true) {
      case first: {
        pipe(
          intersections,
          A.head,
          O.map(({ point, object }) => {
            if (object.userData.type !== UserDataTypeEnum.Enum.ElementMesh)
              return

            traverseUpUntil(
              object,
              (o) =>
                o.userData.type === UserDataTypeEnum.Enum.HouseTransformsGroup,
              (houseTransformGroup) => {
                dispatchPointerDown({ point, object })

                moveData.current = {
                  houseObject: houseTransformGroup as Group,
                  lastPoint: point.setY(0),
                }

                setCameraControlsEnabled(false)

                const scopeItem = elementMeshToScopeItem(object)
                scope.selected = scopeItem

                dispatchOutline({
                  selectedObjects: objectToHouseObjects(object),
                })
              }
            )
            return
          })
        )
        break
      }
      case last: {
        setCameraControlsEnabled(true)
        updateIndexedHouseTransforms(moveData.current!.houseObject)
        moveData.current = null
        dispatchPointerUp()
        return
      }
      default: {
        if (!moveData.current) {
          console.warn(`no moveData.current in onDragMove`)
          return
        }

        const { lastPoint, houseObject } = moveData.current
        const [px, pz] = pointer.xz
        const thisPoint = new Vector3(px, 0, pz)
        const delta = thisPoint.clone().sub(lastPoint)
        moveData.current.lastPoint = thisPoint
        houseObject.position.add(delta)
        return
      }
    }
  }

  return onDragMove
}

export default useOnDragMove
