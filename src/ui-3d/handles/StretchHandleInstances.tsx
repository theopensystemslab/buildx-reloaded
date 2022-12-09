import { Instance } from "@react-three/drei"
import { Fragment, useRef } from "react"
import { Object3D, Vector3 } from "three"
import { useDimensions } from "../../hooks/dimensions"
import { HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { EditModeEnum } from "../../hooks/siteCtx"
import postTransients, {
  usePostTransientHouseTransforms,
} from "../../hooks/transients/post"
import { useSubscribeKey } from "../../utils/hooks"

type Props = {
  houseId: string
}

const StretchHandleInstances = (props: Props) => {
  const { houseId } = props

  const { length = 0 } = useDimensions(houseId) ?? {}

  const frontRef = useRef<Object3D>(null)
  const backRef = useRef<Object3D>(null)

  const frontPositionVector = useRef(new Vector3())
  const backPositionVector = useRef(new Vector3())

  usePostTransientHouseTransforms(
    houseId,
    ({ position: { x, y, z }, rotation }) => {
      if (!frontRef.current || !backRef.current) return

      const offset = 1.5
      const yAxis = new Vector3(0, 1, 0)

      frontRef.current.position.set(0, 0, -(length / 2) - offset)
      backRef.current.position.set(0, 0, length / 2 + offset)

      frontRef.current.position.applyAxisAngle(yAxis, rotation)
      backRef.current.position.applyAxisAngle(yAxis, rotation)

      frontRef.current.position.add(new Vector3(x, y, z + length / 2))
      backRef.current.position.add(new Vector3(x, y, z + length / 2))

      frontPositionVector.current = frontRef.current.position.clone()
      backPositionVector.current = backRef.current.position.clone()
    }
  )

  useSubscribeKey(postTransients, houseId, () => {
    if (!postTransients[houseId]?.stretch) {
      frontRef.current?.position.set(
        frontPositionVector.current.x,
        frontPositionVector.current.y,
        frontPositionVector.current.z
      )
      backRef.current?.position.set(
        backPositionVector.current.x,
        backPositionVector.current.y,
        backPositionVector.current.z
      )
      return
    }

    const { side, dx, dz } = postTransients[houseId].stretch!

    if (side === HandleSideEnum.Enum.FRONT) {
      // const clampedDx = clamp(,0)
      frontRef.current?.position.set(
        frontPositionVector.current.x + dx,
        frontPositionVector.current.y,
        frontPositionVector.current.z + dz
      )
    }

    if (side === HandleSideEnum.Enum.BACK) {
      backRef.current?.position.set(
        backPositionVector.current.x + dx,
        backPositionVector.current.y,
        backPositionVector.current.z + dz
      )
    }
  })

  return (
    <Fragment>
      <Instance
        ref={frontRef}
        rotation-x={-Math.PI / 2}
        position={[0, 0, -1.5]}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.STRETCH,
            side: HandleSideEnum.Enum.FRONT,
          },
        }}
      />
      <Instance
        ref={backRef}
        rotation-x={-Math.PI / 2}
        position={[0, 0, length + 1.5]}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.STRETCH,
            side: HandleSideEnum.Enum.BACK,
          },
        }}
      />
    </Fragment>
  )
}

export default StretchHandleInstances
