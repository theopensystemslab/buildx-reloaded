import { Instance } from "@react-three/drei"
import { Fragment, useRef } from "react"
import { Object3D, Vector3 } from "three"
import dimensions, { useDimensions } from "../../hooks/dimensions"
import { EditModeEnum } from "../../hooks/siteCtx"
import { usePostTransientHouseTransforms } from "../../hooks/transients/post"
import { PI } from "../../utils/math"

type Props = {
  houseId: string
}

const RotateHandleInstances = (props: Props) => {
  const { houseId } = props

  const { width = 0, length = 0 } = useDimensions(houseId) ?? {}

  const handle1Ref = useRef<Object3D>(null)
  const handle2Ref = useRef<Object3D>(null)

  usePostTransientHouseTransforms(
    houseId,
    ({ position: { x, y, z }, rotation }) => {
      if (!handle1Ref.current || !handle2Ref.current || !dimensions[houseId])
        return

      const {
        obb: {
          center: { x: cx, z: cz },
        },
      } = dimensions[houseId]

      const offset = 1.5
      const yAxis = new Vector3(0, 1, 0)

      handle1Ref.current.position.set(0, 0, -(length / 2) - offset)
      handle2Ref.current.position.set(-(width / 2) - offset, 0, 0)

      handle1Ref.current.position.applyAxisAngle(yAxis, rotation)
      handle2Ref.current.position.applyAxisAngle(yAxis, rotation)

      handle1Ref.current.position.add(new Vector3(x, y, z + length / 2))
      handle2Ref.current.position.add(new Vector3(x, y, z + length / 2))
    }
  )

  return (
    <Fragment>
      <Instance
        ref={handle1Ref}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.MOVE_ROTATE,
          },
        }}
        rotation-x={-PI / 2}
      />
      <Instance
        ref={handle2Ref}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.MOVE_ROTATE,
          },
        }}
        rotation-x={-PI / 2}
      />
    </Fragment>
  )
}

export default RotateHandleInstances
