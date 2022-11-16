import { Instance } from "@react-three/drei"
import { Fragment, useRef } from "react"
import { Object3D } from "three"
import * as z from "zod"
import { useDimensions } from "../../hooks/dimensions"
import { HandleDragEvent, HandleSideEnum } from "../../hooks/drag/handles"
import { EditModeEnum } from "../../hooks/siteCtx"
import { useHouseTransforms } from "../../hooks/transients"

type Props = {
  houseId: string
}

const StretchHandleInstances = (props: Props) => {
  const { houseId } = props

  const { length = 0 } = useDimensions(houseId) ?? {}

  const frontRef = useRef<Object3D>(null)
  const backRef = useRef<Object3D>(null)

  useHouseTransforms(frontRef, houseId, {
    position: { dz: -1.5 },
    rotation: { dx: -Math.PI / 2 },
  })
  useHouseTransforms(backRef, houseId, {
    position: { dz: length + 1.5 },
    rotation: { dx: -Math.PI / 2 },
  })

  return (
    <Fragment>
      <Instance
        ref={frontRef}
        rotation-x={-Math.PI / 2}
        position={[0, 0, -1.5]}
        userData={{
          handleIdentifier: {
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
          handleIdentifier: {
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
