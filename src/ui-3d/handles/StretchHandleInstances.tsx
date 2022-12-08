import { Instance } from "@react-three/drei"
import { Fragment, useRef } from "react"
import { Object3D, Vector3 } from "three"
import dimensions, { useDimensions } from "../../hooks/dimensions"
import { HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { EditModeEnum } from "../../hooks/siteCtx"
import stretchProxy from "../../hooks/stretch"
import { usePostTransientHouseTransforms } from "../../hooks/transients/post"
import { useSubscribeKey } from "../../utils/hooks"

type Props = {
  houseId: string
}

const StretchHandleInstances = (props: Props) => {
  const { houseId } = props

  const { length = 0 } = useDimensions(houseId) ?? {}

  const frontRef = useRef<Object3D>(null)
  const backRef = useRef<Object3D>(null)

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
    }
  )

  // useSubscribeKey(stretchProxy,)

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

export default StretchHandleInstances
