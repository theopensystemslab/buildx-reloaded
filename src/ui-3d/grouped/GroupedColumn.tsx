import { indicesToKey, PositionedColumn } from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Group } from "three"
import dimensions from "../../hooks/dimensions"
import { HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { stretchLengthClamped } from "../../hooks/transients/stretch"
import { RA } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import GroupedModule from "./GroupedModule"

type Props = {
  systemId: string
  houseId: string
  column: PositionedColumn
  start?: boolean
  end?: boolean
}

const GroupedColumn = (props: Props) => {
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

      const { distance, side } = stretchLengthClamped[houseId]

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
  return (
    <group ref={groupRef} key={columnIndex} position-z={columnZ}>
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
}

export default GroupedColumn
