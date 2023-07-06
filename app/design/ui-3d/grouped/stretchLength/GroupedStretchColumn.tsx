import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Group } from "three"
import { RA } from "~/utils/functions"
import { GridGroup } from "../../../../workers/layouts"
import { useZStretchHouseListener } from "../../../state/events"
import GroupedStretchModule from "./GroupedStretchModule"

type Props = {
  systemId: string
  houseId: string
  gridGroups: GridGroup[]
  direction: number
  columnZ: number
  columnLength: number
}

const GroupedStretchColumn = (props: Props) => {
  const { systemId, houseId, gridGroups: rows, columnZ, columnLength } = props

  const groupRef = useRef<Group>(null)

  useZStretchHouseListener((detail) => {
    if (houseId !== detail.houseId) return

    const { distance, direction, dx, dz, last } = detail

    // if (!stretchLengthClamped[houseId]) {
    //   groupRef.current?.scale.set(0, 0, 0)
    //   return
    // }

    if (direction !== props.direction) return

    if (direction === 1 && distance + columnLength / 2 > columnZ) {
      groupRef.current?.scale.set(1, 1, 1)
    } else if (direction === -1 && distance + columnLength / 2 < columnZ) {
      groupRef.current?.scale.set(1, 1, 1)
    } else {
      groupRef.current?.scale.set(0, 0, 0)
    }

    invalidate()
  })

  return (
    <group ref={groupRef} scale={[0, 0, 0]}>
      {pipe(
        rows,
        RA.chain(({ modules, levelIndex, y: levelY }) =>
          pipe(
            modules,
            RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
              return (
                <group
                  key={`${gridGroupIndex}:${module.dna}`}
                  position={[0, levelY, 0]}
                >
                  <GroupedStretchModule
                    {...{
                      systemId,
                      houseId,
                      module,
                      levelIndex,
                      gridGroupIndex,
                      levelY,
                      moduleZ,
                      mirror: true,
                    }}
                  />
                </group>
              )
            })
          )
        )
      )}
    </group>
  )
}

export default GroupedStretchColumn
