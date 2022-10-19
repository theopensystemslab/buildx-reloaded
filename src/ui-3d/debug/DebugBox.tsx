import { pipe } from "fp-ts/lib/function"
import { useCallback, useEffect, useRef, useState } from "react"
import { Matrix4, Mesh } from "three"
import { subscribeKey } from "valtio/utils"
import houses from "../../hooks/houses"
import obbs from "../../hooks/obb"
import { RA } from "../../utils/functions"

type Props = {
  houseId: string
}

const DebugBox = (props: Props) => {
  const { houseId } = props
  const meshRef = useRef<Mesh>(null)

  const [width, setWidth] = useState<number | null>(null)
  const [length, setLength] = useState<number | null>(null)

  const m4 = useRef(new Matrix4())

  const update = useCallback(() => {
    const obb = obbs[houseId]
    const { center, halfSize, rotation } = obb

    if (width === null) setWidth(halfSize.x * 2)
    if (length === null) setLength(halfSize.z * 2)

    if (!meshRef.current) return

    const { x, y, z } = center

    m4.current.setFromMatrix3(rotation)
    meshRef.current.setRotationFromMatrix(m4.current)
    meshRef.current.position.set(x, y + halfSize.y / 2, z)
  }, [houseId, length, width])

  useEffect(() => {
    update()
    return subscribeKey(obbs, houseId, update)
  }, [houseId, update])

  return (
    <mesh ref={meshRef}>
      <boxBufferGeometry args={[width ?? 0, 1, length ?? 0]} />
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

export default DebugBox
