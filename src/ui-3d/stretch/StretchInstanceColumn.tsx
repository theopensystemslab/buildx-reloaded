import {
  ColumnLayoutKeyInput,
  getVanillaColumnKey,
  GridGroup,
  indicesToKey,
  PositionedColumn,
} from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { RA } from "../../utils/functions"
import StretchInstanceModule from "./StretchInstanceModule"

type Props = {
  systemId: string
  houseId: string
  gridGroups: GridGroup[]
  columnZ: number
}

const StretchInstanceColumn = (props: Props) => {
  const { systemId, houseId, gridGroups: rows, columnZ } = props

  return (
    <Fragment>
      {pipe(
        rows,
        RA.chain(({ modules, levelIndex, y: levelY }) =>
          pipe(
            modules,
            RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
              return (
                <StretchInstanceModule
                  key={getVanillaColumnKey({
                    systemId,
                    houseId,
                    levelIndex,
                    gridGroupIndex,
                    columnZ,
                  })}
                  {...{
                    systemId,
                    houseId,
                    module,
                    levelIndex,
                    gridGroupIndex,
                    columnZ,
                    levelY,
                    moduleZ,
                    mirror: true,
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

export default StretchInstanceColumn
