import { pipe } from "fp-ts/lib/function"
import { useCallback, useEffect, useRef, useState } from "react"
import { Group } from "three"
import { subscribeKey } from "valtio/utils"
import dimensions from "../../hooks/dimensions"
import houses from "../../hooks/houses"
import { RA } from "../../utils/functions"

type Props = {
  houseId: string
}

const DebugBox = (props: Props) => {
  const { houseId } = props

  const [circles, setCircles] = useState<[number, number][]>([])

  const update = useCallback(() => {
    const {
      min: { x: x0, y: z0 },
      max: { x: x1, y: z1 },
    } = dimensions[houseId]

    setCircles([
      [x0, z0],
      [x1, z1],
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
        RA.mapWithIndex((i, [x, z]) => (
          <mesh key={i} position={[x, 0, z]}>
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        ))
      )}
    </group>
  )
}

export default DebugBox
