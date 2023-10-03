import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Matrix4, Vector3 } from "three"
import { ref } from "valtio"
import {
  A,
  O,
  pipeLog,
  pipeLogWith,
  someOrError,
} from "../../../../utils/functions"
import pointer from "../../../state/pointer"
import scope from "../../../state/scope"
import { dispatchOutline } from "../events/outlines"
import {
  findFirstGuardUp,
  getActiveHouseUserData,
  objectToHouseObjects,
} from "../helpers/sceneQueries"
import { AABB_OFFSET } from "../scene/houseLayoutGroup"
import {
  elementMeshToScopeItem,
  HouseLayoutGroup,
  HouseTransformsGroup,
  isHouseTransformsGroup,
  UserDataTypeEnum,
} from "../scene/userData"

const useOnDragMove = () => {
  const moveData = useRef<{
    lastPoint: Vector3
    point0: Vector3
    houseTransformsGroup: HouseTransformsGroup
    layoutGroup: HouseLayoutGroup
    nearHouseTransformGroups: HouseTransformsGroup[]
    thresholdFactor: number
  } | null>(null)

  const onDragMove: Handler<"drag", ThreeEvent<PointerEvent>> = (state) => {
    const {
      first,
      last,
      event: { intersections },
    } = state

    const computeNearHouseTransformsGroups = (
      houseTransformsGroup: HouseTransformsGroup
    ): HouseTransformsGroup[] =>
      pipe(
        houseTransformsGroup.parent,
        O.fromNullable,
        O.map((scene) =>
          pipe(
            scene.children,
            A.filterMap((htg) => {
              if (
                !isHouseTransformsGroup(htg) ||
                htg.uuid === houseTransformsGroup.uuid
              ) {
                return O.none
              }

              const { aabb } = getActiveHouseUserData(houseTransformsGroup)

              return getActiveHouseUserData(htg).aabb.intersectsBox(aabb)
                ? O.some(htg)
                : O.none
            })
          )
        ),
        O.getOrElse((): HouseTransformsGroup[] => [])
      )

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
                const nearHouseTransformGroups =
                  computeNearHouseTransformsGroups(houseTransformsGroup)

                const layoutGroup = pipe(
                  houseTransformsGroup.userData.getActiveLayoutGroup(),
                  someOrError(`no active layout group in move`)
                )

                point.setY(0)

                moveData.current = {
                  houseTransformsGroup,
                  lastPoint: point,
                  point0: point,
                  nearHouseTransformGroups,
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
      default: {
        if (!moveData.current) {
          console.warn(`no moveData.current in onDragMove`)
          return
        }

        const {
          lastPoint,
          houseTransformsGroup,
          nearHouseTransformGroups,
          point0,
          thresholdFactor,
          layoutGroup,
        } = moveData.current

        let collision = false

        const [px, pz] = pointer.xz
        const thisPoint = new Vector3(px, 0, pz)
        const delta: Vector3 = thisPoint.clone().sub(lastPoint)

        const { obb: thisOBB } = getActiveHouseUserData(houseTransformsGroup)

        thisOBB.center.add(delta)

        for (const nearHouse of nearHouseTransformGroups) {
          const { obb: nearOBB } = getActiveHouseUserData(nearHouse)

          console.log(`obb check`)

          if (thisOBB.intersectsOBB(nearOBB)) {
            collision = true
          }
        }

        if (collision) {
          thisOBB.center.sub(delta)
          return
        }

        layoutGroup.userData.updateBBs()

        moveData.current.lastPoint = thisPoint

        houseTransformsGroup.position.add(delta)

        const dts = point0.distanceToSquared(thisPoint)
        const threshold = (AABB_OFFSET - 1) ** 2

        if (dts >= threshold * thresholdFactor) {
          moveData.current.nearHouseTransformGroups =
            computeNearHouseTransformsGroups(houseTransformsGroup)

          moveData.current.thresholdFactor++
        }

        return
      }
    }
  }

  return onDragMove
}

export default useOnDragMove
