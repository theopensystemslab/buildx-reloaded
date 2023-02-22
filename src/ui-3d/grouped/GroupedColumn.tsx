import { indicesToKey, PositionedColumn } from "@/hooks/layouts"
import { GroupProps } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { forwardRef, useRef } from "react"
import mergeRefs from "react-merge-refs"
import { Group } from "three"
import { useStretchLengthStartEndColumn } from "../../hooks/transients/stretchLength"
import { RA } from "../../utils/functions"
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

  const columnGroupRef = useRef<Group>(null!)

  useStretchLengthStartEndColumn({
    houseId,
    columnGroupRef,
    columnZ,
    columnLength,
    start,
    end,
  })

  const mergedRef = mergeRefs([ref, columnGroupRef])

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
