import {
  ColumnLayoutKeyInput,
  indicesToKey,
  PositionedColumn,
} from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { RA } from "../../utils/functions"
import DefaultModule from "./DefaultModule"

type Props = {
  systemId: string
  houseId: string
  column: PositionedColumn
  startColumn?: boolean
  endColumn?: boolean
}
const DefaultColumn = (props: Props) => {
  const {
    column: { gridGroups, columnIndex, z: columnZ },
    startColumn = false,
    endColumn = false,
    systemId,
    houseId,
  } = props

  return (
    <Fragment key={columnIndex}>
      {pipe(
        gridGroups,
        RA.chain(({ modules, levelIndex, y: levelY }) =>
          pipe(
            modules,
            RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
              return (
                <DefaultModule
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
                    columnZ,
                    levelY,
                    moduleZ,
                    startColumn,
                    endColumn,
                  }}
                />
              )
            })
          )
        )
      )}
    </Fragment>
  )
}

export default DefaultColumn
