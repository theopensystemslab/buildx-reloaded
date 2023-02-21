import { indicesToKey, PositionedColumn } from "@/hooks/layouts"
import { GroupProps } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { forwardRef, useRef } from "react"
import mergeRefs from "react-merge-refs"
import { Group } from "three"
import dimensions from "../../hooks/dimensions"
import { HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { stretchLengthClamped } from "../../hooks/transients/stretchLength"
import { RA } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import GroupedModule from "./GroupedModule"

type Props = GroupProps & {
  systemId: string
  houseId: string
  column: PositionedColumn
  start?: boolean
  end?: boolean
}

const GroupedColumn = forwardRef<Group, Props>((props, ref) => {
  const {
    systemId,
    houseId,
    column: { gridGroups, columnIndex, z: columnZ, length: columnLength },
    start = false,
    end = false,
  } = props

  const groupRef = useRef<Group>(null)

  useSubscribeKey(
    stretchLengthClamped,
    houseId,
    () => {
      if (!stretchLengthClamped[houseId] || start || end) {
        groupRef.current?.scale.set(1, 1, 1)
        return
      }

      const { distanceZ: distance, side } = stretchLengthClamped[houseId]

      const { length: houseLength } = dimensions[houseId]

      if (
        side === HandleSideEnum.Enum.BACK &&
        houseLength + distance < columnZ
      ) {
        groupRef.current?.scale.set(0, 0, 0)
      } else if (
        side === HandleSideEnum.Enum.FRONT &&
        distance + columnLength > columnZ
      ) {
        groupRef.current?.scale.set(0, 0, 0)
      } else {
        groupRef.current?.scale.set(1, 1, 1)
      }
    },
    true
  )

  const mergedRef = mergeRefs([ref, groupRef])

  return (
    <group ref={mergedRef} key={columnIndex} position-z={columnZ}>
      {pipe(
        gridGroups,
        RA.chain(({ modules, levelIndex, y: levelY }) =>
          pipe(
            modules,
            RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
              return (
                <GroupedModule
                  key={indicesToKey({
                    houseId,
                    columnIndex,
                    levelIndex,
                    gridGroupIndex,
                  })}
                  {...{
                    systemId,
                    houseId,
                    module,
                    columnIndex,
                    levelIndex,
                    gridGroupIndex,
                    // columnZ,
                    levelY,
                    moduleZ,
                    startColumn: start,
                    endColumn: end,
                  }}
                />
              )
            })
          )
        )
      )}
    </group>
  )
})

export default GroupedColumn
