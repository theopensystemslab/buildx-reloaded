import { pipe } from "fp-ts/lib/function"
import { useCallback, useEffect, useState } from "react"
import { subscribeKey } from "valtio/utils"
import dimensions from "../../hooks/dimensions"
import { RA } from "../../utils/functions"

type Props = {
  houseId: string
}

const DebugBox = (props: Props) => {
  const { houseId } = props

  const [circles, setCircles] = useState<[number, number, number][]>([])

  const update = useCallback(() => {
    const {
      min: { x: x0, y: y0, z: z0 },
      max: { x: x1, y: y1, z: z1 },
    } = dimensions[houseId]

    setCircles([
      [x0, y0, z0],
      [x1, y1, z1],
    ])
  }, [houseId])

  useEffect(() => {
    update()
    return subscribeKey(dimensions, houseId, update)
  }, [houseId, update])

  return (
    <group>
      {pipe(
        circles,
        RA.mapWithIndex((i, [x, y, z]) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        ))
      )}
    </group>
  )
}

export default DebugBox
