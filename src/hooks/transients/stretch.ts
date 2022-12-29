import { pipe } from "fp-ts/lib/function"
import { proxy } from "valtio"
import { RA } from "../../utils/functions"
import { HandleSide } from "../gestures/drag/handles"
import { ColumnLayout } from "../layouts"

export type Stretch = {
  side: HandleSide
  dx: number
  dz: number
  distance: number
}

export const stretchLength = proxy<Record<string, Stretch>>({})

export const splitColumns = (layout: ColumnLayout) =>
  pipe(
    layout,
    RA.partition(
      ({ columnIndex }) =>
        columnIndex === 0 || columnIndex === layout.length - 1
    ),
    ({ left: midColumns, right: [startColumn, endColumn] }) => ({
      startColumn,
      endColumn,
      midColumns,
    })
  )
