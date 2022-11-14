import { Instance } from "@react-three/drei"
import React, { Fragment } from "react"
import { useDimensions } from "../../hooks/dimensions"

type Props = {
  houseId: string
}

const RotateHandleInstances = (props: Props) => {
  const { houseId } = props

  const { width, length } = useDimensions(houseId)

  return (
    <Fragment>
      <Instance rotation-x={-Math.PI / 2} position={[0, 0, -1.5]} {...props} />
      <Instance
        rotation-x={-Math.PI / 2}
        position={[-width / 2 - 1.5, 0, length / 2]}
        {...props}
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
