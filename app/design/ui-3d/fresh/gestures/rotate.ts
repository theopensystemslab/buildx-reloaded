import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Vector3 } from "three"
import { A, O } from "../../../../utils/functions"
import { atan2 } from "../../../../utils/math"
import pointer from "../../../state/pointer"
import { updateIndexedHouseTransforms } from "../dimensions"
import {
  getActiveHouseUserData,
  findFirstGuardUp,
} from "../helpers/sceneQueries"
import {
  HouseTransformsGroup,
  isHouseTransformsGroup,
  UserDataTypeEnum,
} from "../scene/userData"

const useOnDragRotate = () => {
  const rotateData = useRef<{
    houseTransformsGroup: HouseTransformsGroup
    center: Vector3
    rotation0: number
    angle0: number
    angle: number
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
                const {
                  obb: {
                    center,
                    center: { x: cx, z: cz },
                  },
                } = getActiveHouseUserData(houseTransformsGroup)

                const { x: x0, z: z0 } = point

                const angle0 = atan2(cz - z0, cx - x0)

                rotateData.current = {
                  houseTransformsGroup,
                  center,
                  rotation0: houseTransformsGroup.rotation.y,
                  angle0,
                  angle: angle0,
                }
              })
            )

            return
          })
        )
        break
      }
      case last: {
        updateIndexedHouseTransforms(rotateData.current!.houseTransformsGroup)
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
        } = rotateData.current

        rotateData.current.angle = atan2(cz - pz, cx - px)

        const angleDifference =
          rotateData.current.angle - rotateData.current.angle0

        houseTransformsGroup.rotation.y =
          rotateData.current.rotation0 - angleDifference

        break
      }
    }
  }

  return onDragRotate
}

export default useOnDragRotate
