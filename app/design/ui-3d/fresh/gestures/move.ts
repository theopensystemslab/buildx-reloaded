import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Vector3 } from "three"
import { ref } from "valtio"
import { A, O } from "../../../../utils/functions"
import pointer from "../../../state/pointer"
import scope from "../../../state/scope"
import { dispatchOutline } from "../events/outlines"
import { findFirstGuardUp, objectToHouseObjects } from "../helpers/sceneQueries"
import { AABB_OFFSET } from "../scene/houseLayoutGroup"
import {
  elementMeshToScopeItem,
  HouseLayoutGroup,
  HouseTransformsGroup,
  isHouseTransformsGroup,
  UserDataTypeEnum,
} from "../scene/userData"
import settings from "../../../state/settings"

const useOnDragMove = () => {
  const moveData = useRef<{
    lastPoint: Vector3
    point0: Vector3
    houseTransformsGroup: HouseTransformsGroup
    layoutGroup: HouseLayoutGroup
    nearNeighbours: HouseTransformsGroup[]
    thresholdFactor: number
  } | null>(null)

  const onDragMove: Handler<"drag", ThreeEvent<PointerEvent>> = (state) => {
    const {
      first,
      last,
      event: { intersections },
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
                const layoutGroup =
                  houseTransformsGroup.userData.getActiveLayoutGroup()

                point.setY(0)

                moveData.current = {
                  houseTransformsGroup,
                  lastPoint: point,
                  point0: point,
                  nearNeighbours:
                    houseTransformsGroup.userData.computeNearNeighbours(),
                  thresholdFactor: 1,
                  layoutGroup,
                }

                const scopeItem = elementMeshToScopeItem(object)
                scope.selected = ref(scopeItem)

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
        const { houseTransformsGroup } = moveData.current!
        houseTransformsGroup.userData.updateTransforms()
        moveData.current = null
        return
      }
      // mid/progress handler
      default: {
        if (!moveData.current) {
          console.warn(`no moveData.current in onDragMove`)
          return
        }

        const {
          lastPoint,
          houseTransformsGroup,
          nearNeighbours,
          point0,
          thresholdFactor,
          layoutGroup,
        } = moveData.current

        const [px, pz] = pointer.xz
        const thisPoint = new Vector3(px, 0, pz)
        const delta: Vector3 = thisPoint.clone().sub(lastPoint)

        const { obb } = layoutGroup.userData

        // move OBB first
        obb.center.add(delta)

        // collision detect
        const collision =
          houseTransformsGroup.userData.checkCollisions(nearNeighbours)

        // if collision, reverse the OBB position delta addition and return
        if (collision) {
          obb.center.sub(delta)
          return
        }

        moveData.current.lastPoint = thisPoint

        houseTransformsGroup.position.add(delta)

        const dts = point0.distanceToSquared(thisPoint)
        const threshold = (AABB_OFFSET - 1) ** 2

        layoutGroup.userData.updateBBs()

        if (settings.verticalCuts.length || settings.verticalCuts.width) {
          houseTransformsGroup.userData.setVerticalCuts()
        }

        if (dts >= threshold * thresholdFactor) {
          moveData.current.nearNeighbours =
            houseTransformsGroup.userData.computeNearNeighbours()

          moveData.current.thresholdFactor++
        }

        return
      }
    }
  }

  return onDragMove
}

export default useOnDragMove
