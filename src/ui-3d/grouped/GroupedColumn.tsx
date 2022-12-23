import { indicesToKey, PositionedColumn } from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { RA } from "../../utils/functions"
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

  return (
    <group key={columnIndex} position-z={columnZ}>
      {pipe(
        gridGroups,
        RA.chain(({ modules, levelIndex, y: levelY }) =>
          pipe(
            modules,
            RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
              return (
                <GroupedModule
                  key={indicesToKey({
                    systemId,
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
