import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef, useState } from "react"
import { Matrix4, Mesh } from "three"
import dimensions from "../../hooks/dimensions"
import { useHouseKeys } from "../../hooks/houses"
import { A, RA } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"

const DebugDimensionsBox = ({ houseId }: { houseId: string }) => {
  const ref = useRef<Mesh>(null)
  const [width, setWidth] = useState<number | null>(null)
  const [length, setLength] = useState<number | null>(null)
  const [height, setHeight] = useState<number | null>(null)

  const m4 = useRef(new Matrix4())

  useSubscribeKey(dimensions, houseId, () => {
    if (!ref.current || !dimensions[houseId]) return
    const {
      obb: { center, halfSize, rotation },
    } = dimensions[houseId]

    if (width === null) setWidth(halfSize.x * 2)
    if (length === null) setLength(halfSize.z * 2)
    if (height === null) setHeight(halfSize.y * 2)

    const { x, y, z } = center
    m4.current.setFromMatrix3(rotation)
    ref.current.setRotationFromMatrix(m4.current)
    ref.current.position.set(x, y + halfSize.y, z)
  })

  // todo: include central circle
  return (
    <mesh ref={ref}>
      <boxBufferGeometry args={[width ?? 0, height ?? 0, length ?? 0]} />
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
