import { Module } from "@/server/data/modules"
import { liveQuery } from "dexie"
import { transpose as transposeA } from "fp-ts-std/Array"
import { transpose as transposeRA } from "fp-ts-std/ReadonlyArray"
import * as A from "fp-ts/Array"
import { pipe } from "fp-ts/lib/function"
import * as RA from "fp-ts/ReadonlyArray"
import { suspend } from "suspend-react"
import { proxy, ref, useSnapshot } from "valtio"
import { usePadColumn } from "../../data/modules"
import layoutsDB, { LayoutKey, serializeLayoutKey } from "../../db/layouts"
import { isSSR } from "../../utils/next"
import { getLayoutsWorker } from "../../workers"
import {
  ColumnLayout,
  HouseModuleIdentifier,
  PositionedColumn,
  RowLayout,
} from "../../workers/layouts"
import { useHouse } from "./houses"

export const layouts = proxy<
  Record<string, ColumnLayout> // systemId:dnas : Layout
>({})

if (!isSSR()) {
  liveQuery(() => layoutsDB.layouts.toArray()).subscribe((dbLayouts) => {
    for (let { layoutsKey, layout } of dbLayouts) {
      if (!(layoutsKey in layouts)) {
        layouts[layoutsKey] = ref(layout)
      }
    }
  })
}

export const useDnasLayout = (layoutsKey: LayoutKey): ColumnLayout => {
  const snap = useSnapshot(layouts) as typeof layouts
  const serialKey = serializeLayoutKey(layoutsKey)
  const maybeLayout: ColumnLayout | undefined = snap?.[serialKey]

  return suspend(async () => {
    if (maybeLayout) return maybeLayout

    const layoutsWorker = getLayoutsWorker()

    if (layoutsWorker === null)
      throw new Error(`layoutsWorker null in useDnasLayout`)

    const layout = await layoutsWorker.processLayout(layoutsKey)
    layouts[serialKey] = layout

    return layout
  }, [maybeLayout])
}

export const columnLayoutToDNA = (
  columnLayout: Omit<PositionedColumn, "length" | "z" | "columnIndex">[]
) =>
  pipe(
    columnLayout,
    RA.map(({ gridGroups }) =>
      pipe(
        gridGroups,
        RA.map(({ modules }) =>
          pipe(
            modules,
            RA.map(({ module }) => module.dna)
          )
        )
      )
    ),
    transposeRA,
    RA.flatten,
    RA.flatten
  ) as string[]

export const columnLayoutToMatrix = (columnLayout: ColumnLayout) => {
  return pipe(
    columnLayout,
    A.map((column) =>
      pipe(
        column.gridGroups,
        A.map((gridGroup) =>
          pipe(
            gridGroup.modules,
            A.map(({ module }) => module)
          )
        )
      )
    )
  )
}

export const useColumnMatrix = (houseId: string) => {
  const { systemId, dnas } = useHouse(houseId)
  const layoutsSnap = useSnapshot(layouts) as typeof layouts
  return columnLayoutToMatrix(
    layoutsSnap[serializeLayoutKey({ systemId, dnas })]
  )
}

export const columnMatrixToDna = (columnMatrix: Module[][][]) =>
  pipe(
    columnMatrix,
    A.map(A.map(A.map((x) => x.dna))),
    transposeA,
    A.flatten,
    A.flatten
  )

export const rowLayoutToMatrix = (rowLayout: RowLayout) =>
  pipe(
    rowLayout,
    A.map(({ modules }) =>
      pipe(
        modules,
        RA.map(({ module }) => module)
      )
    )
  )

export const rowMatrixToDna = (rowMatrix: Module[][]) =>
  pipe(
    rowMatrix,
    A.flatten,
    A.map((x) => x.dna)
  )

export const usePadColumnMatrix = (systemId: string) => {
  const padColumn = usePadColumn(systemId)
  return (columnMatrix: Module[][][]) => pipe(columnMatrix, A.map(padColumn))
}

export const indicesToKey = ({
  houseId,
  columnIndex,
  levelIndex,
  gridGroupIndex,
}: HouseModuleIdentifier) =>
  `${houseId}:${columnIndex},${levelIndex},${gridGroupIndex}`
