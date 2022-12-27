import {
  ColumnLayoutKeyInput,
  getVanillaColumnKey,
  GridGroup,
  indicesToKey,
  PositionedColumn,
} from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { HandleSide } from "@/hooks/gestures/drag/handles"
import { RA } from "@/utils/functions"
import GroupedStretchModule from "./GroupedStretchModule"

type Props = {
  systemId: string
  houseId: string
  gridGroups: GridGroup[]
  side: HandleSide
}

const GroupedStretchColumn = (props: Props) => {
  const { systemId, houseId, gridGroups: rows, side } = props

  return (
    <Fragment>
      {pipe(
        rows,
        RA.chain(({ modules, levelIndex, y: levelY }) =>
          pipe(
            modules,
            RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
              return (
                <GroupedStretchModule
                  key={`${side}:${gridGroupIndex}:${module.dna}`}
                  {...{
                    systemId,
                    houseId,
                    module,
                    levelIndex,
                    gridGroupIndex,
                    levelY,
                    moduleZ,
                    mirror: true,
                    side,
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

export default GroupedStretchColumn
