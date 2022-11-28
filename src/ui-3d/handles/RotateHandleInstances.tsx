import { Instance } from "@react-three/drei"
import React, { Fragment, useRef } from "react"
import { Object3D } from "three"
import { useDimensions } from "../../hooks/dimensions"
import { EditModeEnum } from "../../hooks/siteCtx"
import { useHouseTransforms } from "../../hooks/transients"

type Props = {
  houseId: string
}

const RotateHandleInstances = (props: Props) => {
  const { houseId } = props

  const { width = 0, length = 0 } = useDimensions(houseId) ?? {}

  const handle1Ref = useRef<Object3D>(null)
  const handle2Ref = useRef<Object3D>(null)

  useHouseTransforms(handle1Ref, houseId, {
    position: { z: -1.5 },
    rotation: { x: -Math.PI / 2 },
  })
  useHouseTransforms(handle2Ref, houseId, {
    position: { x: -width / 2 - 1.5, y: 0, z: length / 2 },
    rotation: {
      x: -Math.PI / 2,
    },
  })

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
