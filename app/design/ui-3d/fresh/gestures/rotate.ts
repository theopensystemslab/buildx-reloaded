import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Matrix3, Matrix4, Vector3 } from "three"
import { A, O } from "../../../../utils/functions"
import { atan2 } from "../../../../utils/math"
import pointer from "../../../state/pointer"
import { findFirstGuardUp } from "../helpers/sceneQueries"
import {
  HouseLayoutGroup,
  HouseTransformsGroup,
  isHouseTransformsGroup,
  UserDataTypeEnum,
} from "../scene/userData"
import settings from "../../../state/settings"

const useOnDragRotate = () => {
  const rotateData = useRef<{
    houseTransformsGroup: HouseTransformsGroup
    nearNeighbours: HouseTransformsGroup[]
    layoutGroup: HouseLayoutGroup
    center: Vector3
    rotation0: number
    angle0: number
    angle: number
    obbMatrix4: Matrix4
  } | null>(null)

  const onDragRotate: Handler<"drag", ThreeEvent<PointerEvent>> = (state) => {
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
            if (object.userData.type !== UserDataTypeEnum.Enum.RotateHandleMesh)
              return

            pipe(
              object,
              findFirstGuardUp(isHouseTransformsGroup),
              O.map((houseTransformsGroup) => {
                const layoutGroup =
                  houseTransformsGroup.userData.unsafeGetActiveLayoutGroup()

                const {
                  obb: {
                    center,
                    center: { x: cx, z: cz },
                  },
                } = layoutGroup.userData

                const { x: x0, z: z0 } = point

                const angle0 = atan2(cz - z0, cx - x0)

                const matrix0 = (rotateData.current = {
                  houseTransformsGroup,
                  nearNeighbours:
                    houseTransformsGroup.userData.computeNearNeighbours(),
                  layoutGroup,
                  center,
                  rotation0: houseTransformsGroup.rotation.y,
                  angle0,
                  angle: angle0,
                  obbMatrix4: new Matrix4().setFromMatrix3(
                    layoutGroup.userData.obb.rotation
                  ),
                })
              })
            )

            return
          })
        )
        break
      }
      case last: {
        rotateData.current?.houseTransformsGroup.userData.updateTransforms()
        rotateData.current = null
        break
      }
      default: {
        if (!rotateData.current)
          throw new Error(`no rotateData in onDragRotate progress`)

        const [px, pz] = pointer.xz

        const {
          center: { x: cx, z: cz },
          houseTransformsGroup,
          layoutGroup,
          nearNeighbours,
          obbMatrix4,
          rotation0,
        } = rotateData.current

        rotateData.current.angle = atan2(cz - pz, cx - px)

        const angleDelta = -(
          rotateData.current.angle - rotateData.current.angle0
        )

        const trueY = rotation0 + angleDelta

        const { obb } = layoutGroup.userData

        obb.rotation.setFromMatrix4(obbMatrix4.makeRotationY(trueY))

        if (houseTransformsGroup.userData.checkCollisions(nearNeighbours)) {
          return
        }

        houseTransformsGroup.rotation.y = trueY
        layoutGroup.userData.updateBBs()

        if (settings.verticalCuts.length || settings.verticalCuts.width) {
          houseTransformsGroup.userData.setVerticalCuts()
        }

        break
      }
    }
  }

  return onDragRotate
}

export default useOnDragRotate
