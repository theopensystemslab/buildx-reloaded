import { Instance } from "@react-three/drei"
import React, { Fragment } from "react"
import { useDimensions } from "../../hooks/dimensions"

type Props = {
  houseId: string
}

const StretchHandleInstances = (props: Props) => {
  const { houseId } = props

  const { width = 0, length = 0 } = useDimensions(houseId) ?? {}

  return (
    <Fragment>
      <Instance rotation-x={-Math.PI / 2} position={[0, 0, -1.5]} />
      <Instance rotation-x={-Math.PI / 2} position={[0, 0, length + 1.5]} />
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
