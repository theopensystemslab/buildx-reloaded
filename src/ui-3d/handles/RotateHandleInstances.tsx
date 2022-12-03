import { Instance } from "@react-three/drei"
import React, { Fragment, useRef } from "react"
import { Object3D } from "three"
import { useDimensions } from "../../hooks/dimensions"
import { EditModeEnum } from "../../hooks/siteCtx"
import { useHouseTransforms } from "../../hooks/transients"
import { usePostTransientHouseTransforms } from "../../hooks/transients/post"
import { PI } from "../../utils/math"
import { useSetRotation } from "../../utils/three"

type Props = {
  houseId: string
}

const RotateHandleInstances = (props: Props) => {
  const { houseId } = props

  const { width = 0, length = 0 } = useDimensions(houseId) ?? {}

  const handle1Ref = useRef<Object3D>(null)
  const handle2Ref = useRef<Object3D>(null)

  const setRotation = useSetRotation(houseId)

  usePostTransientHouseTransforms(
    houseId,
    ({ position: { x, y, z }, rotation }) => {
      if (!handle1Ref.current || !handle2Ref.current) return
      handle1Ref.current.position.set(x, y, z - 1.5)
      handle1Ref.current.rotation.x = -PI / 2
      setRotation(handle1Ref.current, rotation, false)
      handle2Ref.current.position.set(x - width / 2 - 1.5, y, z + length / 2)
      handle2Ref.current.rotation.x = -PI / 2
      setRotation(handle2Ref.current, rotation, false)
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
      />
    </Fragment>
  )

  // <CircularHandle
  //   rotation-x={-Math.PI / 2}
  //   position={[0, 0, -1.5]}
  //   {...(bind(0) as any)}
  // />
  // <CircularHandle
  //   rotation-x={-Math.PI / 2}
  //   position={[-houseWidth / 2 - 1.5, 0, houseLength / 2]}
  //   {...(bind(1) as any)}
  // />
}

export default RotateHandleInstances
