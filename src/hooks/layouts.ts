import { transpose as transposeA } from "fp-ts-std/Array"
import { transpose as transposeRA } from "fp-ts-std/ReadonlyArray"
import * as A from "fp-ts/Array"
import { pipe } from "fp-ts/lib/function"
import * as RA from "fp-ts/ReadonlyArray"
import produce from "immer"
import { proxy, ref } from "valtio"
// import { usePadColumn } from "./modules"
import { Module, usePadColumn } from "../data/modules"
import { useHouseRows } from "./houses"

export type PositionedModule = {
  module: Module
  z: number
  gridGroupIndex: number
}

export type PositionedInstancedModule = {
  module: Module
  y: number
  z: number
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
}

export type PositionedRow = {
  levelIndex: number
  levelType: string
  y: number
  modules: Array<PositionedModule>
  length: number
}

export type GridGroup = PositionedRow

export type RowLayout = Array<PositionedRow>

export type PositionedColumn = {
  gridGroups: Array<PositionedRow>
  z: number
  columnIndex: number
  length: number
}

export type ColumnLayout = Array<PositionedColumn>

export const layouts = proxy<
  Record<string, ColumnLayout> // houseId
>({})

export const useRowLayout = (buildingId: string): RowLayout =>
  pipe(
    useHouseRows(buildingId),
    RA.map((row) =>
      pipe(
        row,
        RA.reduceWithIndex(
          [],
          (i, prevs: Array<PositionedModule>, module: Module) => {
            const isFirst: boolean = i === 0

            const z = isFirst
              ? module.length / 2
              : prevs[i - 1].z +
                prevs[i - 1].module.length / 2 +
                module.length / 2

            return [
              ...prevs,
              {
                module,
                z,
                gridGroupIndex: i,
              },
            ]
          }
        )
      )
    ),
    RA.reduceWithIndex(
      [],
      (
        i,
        b: {
          modules: Array<PositionedModule>
          y: number
          levelType: string
          levelIndex: number
          length: number
        }[],
        row
      ) => {
        const levelType = row[0].module.structuredDna.levelType
        const levelLetter = levelType[0]
        const y =
          levelLetter === "F"
            ? -row[0].module.height
            : levelLetter === "G"
            ? 0
            : b[i - 1].y + row[0].module.height

        return [
          ...b,
          {
            modules: row,
            y,
            levelIndex: i,
            levelType: row[0].module.structuredDna.levelType,
            length: row.reduce((acc, m) => acc + m.module.length, 0),
          },
        ]
      }
    )
  )

const analyzeColumn =
  <A extends unknown>(toLength: (a: A) => number) =>
  (as: readonly A[][]) => {
    return pipe(
      as,
      RA.reduceWithIndex(
        { legit: true, target: -1, rows: [] },
        (
          index,
          {
            rows,
            legit,
            target,
          }: {
            rows: { units: number; index: number }[]
            legit: boolean
            target: number
          },
          row: A[]
        ) => {
          const units = row.reduce((acc, a) => acc + toLength(a), 0)
          return {
            rows: [...rows, { units, index }],
            legit: legit && (target === -1 || target === units),
            target: target === -1 ? units : Math.max(target, units),
          }
        }
      )
    )
  }

const columnify =
  <A extends unknown>(toLength: (a: A) => number) =>
  (input: readonly A[][]) => {
    let slices = new Array<[number, number]>(input.length).fill([0, 1])
    const lengths = input.map((v) => v.length)

    let acc: (readonly A[][])[] = []

    const slicesRemaining = () =>
      !pipe(
        RA.zip(slices)(lengths),
        RA.reduce(true, (acc, [length, [start]]) => acc && start > length - 1)
      )

    while (slicesRemaining()) {
      pipe(
        slices,
        RA.mapWithIndex((rowIndex, [start, end]) =>
          input[rowIndex].slice(start, end)
        ),
        (column) =>
          pipe(column, analyzeColumn(toLength), ({ rows, legit, target }) => {
            if (legit) {
              acc = [...acc, column]
              slices = slices.map(([, end]) => [end, end + 1])
            } else {
              slices = slices.map(([start, end], i) =>
                rows[i].units === target ? [start, end] : [start, end + 1]
              )
            }
          })
      )
    }

    return pipe(acc, transposeRA)
  }

export const useColumnLayout = (houseId: string) => {
  const rows = useHouseRows(houseId)

  const columns = pipe(
    rows,
    RA.map((row) =>
      pipe(
        row,
        // group by grid type
        RA.reduce(
          { prev: null, acc: [] },
          (
            { prev, acc }: { prev: Module | null; acc: Module[][] },
            module
          ) => ({
            acc:
              module.structuredDna.positionType ===
                prev?.structuredDna.positionType &&
              module.structuredDna.gridType === prev?.structuredDna.gridType
                ? produce(acc, (draft) => {
                    draft[draft.length - 1].push(module)
                  })
                : produce(acc, (draft) => {
                    draft[draft.length] = [module]
                  }),
            prev: module,
          })
        ),
        ({ acc }) => acc
      )
    ),
    transposeRA
  )

  const sameLengthColumns = pipe(
    columns,
    RA.map((column) =>
      pipe(
        column,
        RA.map((module) =>
          pipe(
            module,
            RA.reduce(0, (b, v) => b + v.structuredDna.gridUnits)
          )
        ),
        RA.reduce(
          { acc: true, prev: null },
          ({ prev }: { prev: number | null }, a: number) => ({
            acc: prev === null || prev === a,
            prev: a as number | null,
          })
        ),
        ({ acc }) => acc
      )
    ),
    RA.reduce(true, (b, a) => b && a)
  )

  if (!sameLengthColumns) throw new Error("not sameLengthColumns")

  const columnifiedFurther = pipe(
    columns,
    RA.map((column) =>
      pipe(
        column,
        columnify((a) => a.structuredDna.gridUnits),
        transposeRA
      )
    ),
    RA.flatten
  )

  const layout = pipe(
    columnifiedFurther,
    RA.reduceWithIndex(
      [],
      (columnIndex, positionedCols: PositionedColumn[], loadedModules) => {
        const last =
          columnIndex === 0 ? null : positionedCols[positionedCols.length - 1]
        const z = !last
          ? 0
          : last.z +
            last.gridGroups[0].modules.reduce(
              (modulesLength, module) => modulesLength + module.module.length,
              0
            )

        const gridGroups = pipe(
          loadedModules,
          RA.reduceWithIndex(
            [],
            (levelIndex, positionedRows: PositionedRow[], modules) => {
              const levelType = modules[0].structuredDna.levelType
              const levelLetter = levelType[0]
              const height = modules[0].height
              const y =
                levelLetter === "F"
                  ? -height
                  : levelLetter === "G"
                  ? 0
                  : positionedRows[levelIndex - 1].y +
                    positionedRows[levelIndex - 1].modules[0].module.height

              return [
                ...positionedRows,
                {
                  modules: pipe(
                    modules,
                    RA.reduceWithIndex(
                      [],
                      (
                        i,
                        positionedModules: PositionedModule[],
                        module: Module
                      ) => {
                        const isFirst: boolean = i === 0

                        const z = isFirst
                          ? module.length / 2
                          : positionedModules[i - 1].z +
                            positionedModules[i - 1].module.length / 2 +
                            module.length / 2

                        return [
                          ...positionedModules,
                          {
                            module,
                            gridGroupIndex: i,
                            z,
                          },
                        ]
                      }
                    )
                  ),
                  levelIndex,
                  levelType,
                  y,
                  length: modules.reduce((acc, m) => acc + m.length, 0),
                },
              ]
            }
          )
        )
        return [
          ...positionedCols,
          {
            columnIndex,
            gridGroups,
            z,
            length: gridGroups[0].length,
          },
        ]
      }
    )
  )

  layouts[houseId] = ref(layout)

  return layout
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
    RA.map((column) =>
      pipe(
        column.gridGroups,
        RA.map((gridGroup) =>
          pipe(
            gridGroup.modules,
            RA.map(({ module }) => module)
          )
        )
      )
    )
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

export const useColumnMatrix = (buildingId: string) => {
  const columnLayout = useColumnLayout(buildingId)
  return columnLayoutToMatrix(columnLayout)
}

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

export const useRowMatrix = (buildingId: string) => {
  const rowLayout = useRowLayout(buildingId)
  return rowLayoutToMatrix(rowLayout)
}

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

type SystemHouseLayouts = Map<string, {}>

export const useHouseLayouts = (): SystemHouseLayouts => {
  return undefined as any
}

export type ColumnLayoutKeyInput = {
  systemId: string
  houseId: string
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
}

export const indicesToKey = ({
  systemId,
  houseId,
  columnIndex,
  levelIndex,
  gridGroupIndex,
}: ColumnLayoutKeyInput) =>
  `system:${systemId}-house:${houseId}-location:${columnIndex},${levelIndex},${gridGroupIndex}`

export const getVanillaColumnKey = ({
  systemId,
  houseId,
  levelIndex,
  gridGroupIndex,
  columnZ,
}: Omit<ColumnLayoutKeyInput, "columnIndex"> & { columnZ: number }) =>
  `system:${systemId}-house:${houseId}-location:${columnZ},${levelIndex},${gridGroupIndex}`
