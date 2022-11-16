import { Instance } from "@react-three/drei"
import React, { Fragment, useRef } from "react"
import { useDimensions } from "../../hooks/dimensions"
import {
  useHouseTransforms,
  useStretchHandleTransforms,
} from "../../hooks/transients"
import * as z from "zod"
import { Object3D } from "three"
import { EditModeEnum } from "../../hooks/siteCtx"

type Props = {
  houseId: string
}

export const StretchHandleSideEnum = z.enum(["FRONT", "BACK", "LEFT", "RIGHT"])

export type StrechHandleSide = z.infer<typeof StretchHandleSideEnum>

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
          houseId,
          editMode: EditModeEnum.Enum.STRETCH,
          side: StretchHandleSideEnum.Enum.FRONT,
        }}
      />
      <Instance
        ref={backRef}
        rotation-x={-Math.PI / 2}
        position={[0, 0, length + 1.5]}
        userData={{
          houseId,
          editMode: EditModeEnum.Enum.STRETCH,
          side: StretchHandleSideEnum.Enum.BACK,
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
