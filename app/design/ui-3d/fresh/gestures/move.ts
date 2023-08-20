import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Vector3 } from "three"
import { A, O } from "../../../../utils/functions"
import pointer from "../../../state/pointer"
import scope from "../../../state/scope"
import { updateIndexedHouseTransforms } from "../dimensions"
import { dispatchOutline } from "../events/outlines"
import { objectToHouseObjects, findFirstGuardUp } from "../helpers/sceneQueries"
import {
  elementMeshToScopeItem,
  HouseTransformsGroup,
  isHouseTransformsGroup,
  UserDataTypeEnum,
} from "../userData"

const useOnDragMove = () => {
  const moveData = useRef<{
    lastPoint: Vector3
    houseTransformsGroup: HouseTransformsGroup
  } | null>(null)

  const onDragMove: Handler<"drag", ThreeEvent<PointerEvent>> = (state) => {
    const {
      first,
      last,
      event: { intersections, stopPropagation },
    } = state

    switch (true) {
      case first: {
        pipe(
          intersections,
          A.head,
          O.map(({ point, object }) => {
            if (object.userData.type !== UserDataTypeEnum.Enum.ElementMesh)
              return

            pipe(
              object,
              findFirstGuardUp(isHouseTransformsGroup),
              O.map((houseTransformsGroup) => {
                moveData.current = {
                  houseTransformsGroup,
                  lastPoint: point.setY(0),
                }

                const scopeItem = elementMeshToScopeItem(object)
                scope.selected = scopeItem

                dispatchOutline({
                  selectedObjects: objectToHouseObjects(object),
                })
              })
            )

            return
          })
        )
        break
      }
      case last: {
        updateIndexedHouseTransforms(moveData.current!.houseTransformsGroup)
        moveData.current = null
        return
      }
      default: {
        if (!moveData.current) {
          console.warn(`no moveData.current in onDragMove`)
          return
        }

        const { lastPoint, houseTransformsGroup: houseObject } =
          moveData.current
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
