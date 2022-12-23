import { indicesToKey, PositionedColumn } from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { RA } from "../../utils/functions"
import DemoModule from "./DemoModule"

type Props = {
  systemId: string
  houseId: string
  column: PositionedColumn
  start?: boolean
  end?: boolean
}

const DemoColumn = (props: Props) => {
  const {
    systemId,
    houseId,
    column: { gridGroups, columnIndex, z: columnZ },
    start = false,
    end = false,
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
                <DemoModule
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
                    start: start,
                    end: end,
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

export default DemoColumn
