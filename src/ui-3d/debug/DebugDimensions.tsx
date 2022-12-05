import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef, useState } from "react"
import { Matrix3, Matrix4, Mesh, Vector3 } from "three"
import dimensions, { useDimensions } from "../../hooks/dimensions"
import houses, { useHouseKeys } from "../../hooks/houses"
import { usePostTransientHouseTransforms } from "../../hooks/transients/post"
import { A, RA } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"

const DebugDimensionsBox = ({ houseId }: { houseId: string }) => {
  const ref = useRef<Mesh>(null)

  const {
    width,
    height,
    length,
    obb: {
      halfSize: { y: halfHeight, z: halfLength },
      center,
    },
  } = useDimensions(houseId)

  usePostTransientHouseTransforms(
    houseId,
    ({ position: { x, y, z }, rotation }) => {
      if (!ref.current) return
      ref.current.rotation.y = rotation
      ref.current.position.set(x, y + halfHeight, z + halfLength)
    }
  )

  // todo: include central circle
  return (
    <mesh ref={ref} position={center}>
      <boxBufferGeometry args={[width, height, length]} />
      <meshBasicMaterial color="yellow" />
      {/* {pipe(
        circles,
        RA.mapWithIndex((i, [x, y, z]) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        ))
      )} */}
    </mesh>
  )
}

const DebugDimensions = () => {
  const houseKeys = useHouseKeys()
  return (
    <Fragment>
      {pipe(
        houseKeys,
        RA.map((k) => <DebugDimensionsBox key={k} houseId={k} />)
      )}
    </Fragment>
  )
}

export default DebugDimensions
