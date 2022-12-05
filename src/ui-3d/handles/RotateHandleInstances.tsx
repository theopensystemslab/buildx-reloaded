import { Instance } from "@react-three/drei"
import React, { Fragment, useRef } from "react"
import { Object3D, Vector3 } from "three"
import dimensions, { useDimensions } from "../../hooks/dimensions"
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

      // const center = new Vector3(cx, 0, cz)

      // const v = new Vector3(center.x, 0, center.z)
      // v.applyAxisAngle(new Vector3(0, 1, 0), rotation)

      // handle1Ref.current.position.set(center.x, center.y, center.z)
      // handle1Ref.current.position.sub(center)

      // handle1Ref.current.position.set(0,0,0)
      // handle1Ref.current.position.applyAxisAngle(yAxis, rotation)
      // handle1Ref.current.position.add(center)

      // handle2Ref.current.position.set(cx - width / 2 - 1.5, 0, cz)
      // handle2Ref.current.position.sub(center)
      // handle2Ref.current.position.applyAxisAngle(yAxis, rotation)
      // handle2Ref.current.position.add(center)

      // handle2Ref.current.position.set(x - width / 2 - 1.5, y, z + length / 2)
      // handle2Ref.current.position.sub(center)
      // handle2Ref.current.position.applyAxisAngle(yAxis, rotation)
      // handle2Ref.current.position.add(center)

      // setRotation(handle1Ref.current, rotation, false)
      // setRotation(handle2Ref.current, rotation, false)
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
        // scale={[0, 0, 0]}
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
