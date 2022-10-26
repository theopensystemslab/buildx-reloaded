import { useCallback, useEffect, useRef, useState } from "react"
import { Matrix4, Mesh } from "three"
import { subscribeKey } from "valtio/utils"
import dimensions from "../../hooks/dimensions"

type Props = {
  houseId: string
}

const DebugBox = (props: Props) => {
  const { houseId } = props
  const meshRef = useRef<Mesh>(null)

  const [width, setWidth] = useState<number | null>(null)
  const [length, setLength] = useState<number | null>(null)
  const [height, setHeight] = useState<number | null>(null)

  const m4 = useRef(new Matrix4())

  const update = useCallback(() => {
    const {
      obb: { center, halfSize, rotation },
    } = dimensions[houseId]

    if (width === null) setWidth(halfSize.x * 2)
    if (length === null) setLength(halfSize.z * 2)
    if (height === null) setHeight(halfSize.y * 2)

    if (!meshRef.current) return

    const { x, y, z } = center

    m4.current.setFromMatrix3(rotation)
    meshRef.current.setRotationFromMatrix(m4.current)
    meshRef.current.position.set(x, y + halfSize.y, z)
  }, [houseId, length, width, height])

  useEffect(() => {
    update()
    return subscribeKey(dimensions, houseId, update)
  }, [houseId, update])

  return (
    <mesh ref={meshRef}>
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

export default DebugBox
