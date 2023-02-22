import { GridGroup } from "@/hooks/layouts"
import { RA } from "@/utils/functions"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Group } from "three"
import { stretchLengthClamped } from "../../../hooks/transients/stretchLength"
import { useSubscribeKey } from "../../../utils/hooks"
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

  useSubscribeKey(
    stretchLengthClamped,
    houseId,
    () => {
      if (!stretchLengthClamped[houseId]) {
        groupRef.current?.scale.set(0, 0, 0)
        return
      }

      const { distance, direction } = stretchLengthClamped[houseId]

      if (direction !== props.direction) return

      if (direction === 1 && distance + columnLength / 2 > columnZ) {
        groupRef.current?.scale.set(1, 1, 1)
      } else if (direction === -1 && distance + columnLength / 2 < columnZ) {
        groupRef.current?.scale.set(1, 1, 1)
      } else {
        groupRef.current?.scale.set(0, 0, 0)
      }
    },
    true
  )

  return (
    <group ref={groupRef}>
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
