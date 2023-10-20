import { expose } from "comlink"
import { liveQuery } from "dexie"
import { transpose as transposeA } from "fp-ts-std/Array"
import { transpose as transposeRA } from "fp-ts-std/ReadonlyArray"
import * as RA from "fp-ts/ReadonlyArray"
import { flow, pipe } from "fp-ts/lib/function"
import produce from "immer"
import { LevelType } from "../../../server/data/levelTypes"
import { Module } from "../../../server/data/modules"
import { SectionType } from "../../../server/data/sectionTypes"
import { WindowType } from "../../../server/data/windowTypes"
import {
  filterCompatibleModules,
  topCandidateByHamming,
} from "../../data/modules"
import layoutsDB, {
  ColumnLayout,
  HouseLayoutsKey,
  PositionedColumn,
  PositionedModule,
  PositionedRow,
  VanillaColumnsKey,
} from "../../db/layouts"
import systemsDB from "../../db/systems"
import { Side } from "../../design/state/camera"
import {
  A,
  O,
  T,
  TO,
  pipeLog,
  reduceToOption,
  someOrError,
  unwrapSome,
} from "../../utils/functions"
import { round, sign } from "../../utils/math"
import { isSSR } from "../../utils/next"
import { getModules, getWindowTypeAlternatives } from "./modules"
import {
  getIndexedVanillaModule,
  getVanillaModule,
  postVanillaColumn,
} from "./vanilla"

export const columnMatrixToDna = (columnMatrix: Module[][][]) =>
  pipe(
    columnMatrix,
    A.map(A.map(A.map((x) => x.dna))),
    transposeA,
    A.flatten,
    A.flatten
  )

export const rowMatrixToDna = (rowMatrix: Module[][]) =>
  pipe(
    rowMatrix,
    A.flatten,
    A.map((x) => x.dna)
  )
export const columnLayoutToMatrix = (columnLayout: ColumnLayout) => {
  return pipe(
    columnLayout,
    A.map((column) =>
      pipe(
        column.positionedRows,
        A.map((gridGroup) =>
          pipe(
            gridGroup.positionedModules,
            A.map(({ module }) => module)
          )
        )
      )
    )
  )
}
const modulesToRows = (modules: Module[]): Module[][] => {
  const jumpIndices = pipe(
    modules,
    RA.filterMapWithIndex((i, m) =>
      m.structuredDna.positionType === "END" ? O.some(i) : O.none
    ),
    RA.filterWithIndex((i) => i % 2 === 0)
  )

  return pipe(
    modules,
    RA.reduceWithIndex(
      [],
      (moduleIndex, modules: Module[][], module: Module) => {
        return jumpIndices.includes(moduleIndex)
          ? [...modules, [{ ...module, moduleIndex }]]
          : produce(
              (draft) =>
                void draft[draft.length - 1].push({ ...module, moduleIndex })
            )(modules)
      }
    )
  )
}

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
  (input: A[][]) => {
    let slices = new Array<[number, number]>(input.length).fill([0, 1])
    const lengths = input.map((v) => v.length)

    let acc: A[][][] = []

    const slicesRemaining = () =>
      !pipe(
        A.zip(slices)(lengths),
        A.reduce(true, (acc, [length, [start]]) => acc && start > length - 1)
      )

    while (slicesRemaining()) {
      pipe(
        slices,
        A.mapWithIndex((rowIndex, [start, end]) =>
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

    return pipe(acc, transposeA)
  }
// This helper function allows you to map over an array
// within a Task context (i.e., Task<Array<T>> -> Task<Array<U>>)
const mapTaskArray = <T, U>(
  taskArray: T.Task<T[]>,
  fn: (value: T) => T.Task<U>
): T.Task<U[]> => {
  return pipe(
    taskArray,
    T.chain((arr) => T.sequenceArray(arr.map(fn))),
    T.map((arr) => [...arr]) // This spreads the elements into a new mutable array
  )
}

const modulesToColumnLayout = (modules: Module[]): T.Task<ColumnLayout> => {
  const matrixColumnsByGridType = pipe(
    modules,
    modulesToRows,
    A.map((row) =>
      pipe(
        row,
        // group by grid type
        A.reduce(
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
    transposeA
  )

  const sameLengthColumns = pipe(
    matrixColumnsByGridType,
    A.map((column) =>
      pipe(
        column,
        A.map((module) =>
          pipe(
            module,
            A.reduce(0, (b, v) => b + v.structuredDna.gridUnits)
          )
        ),
        A.reduce(
          { acc: true, prev: null },
          ({ prev }: { prev: number | null }, a: number) => ({
            acc: prev === null || prev === a,
            prev: a as number | null,
          })
        ),
        ({ acc }) => acc
      )
    ),
    A.reduce(true, (b, a) => b && a)
  )

  if (!sameLengthColumns) throw new Error("not sameLengthColumns")

  const matrixColumnsByGridUnitAlignment = pipe(
    matrixColumnsByGridType,
    A.map((column) =>
      pipe(
        column,
        columnify((a) => a.structuredDna.gridUnits),
        transposeA
      )
    ),
    A.flatten
  )

  let positionedCols: PositionedColumn[] = []

  return pipe(
    T.of(matrixColumnsByGridUnitAlignment), // wrap matrixColumnsByGridUnitAlignment in a Task context
    T.chain((matrixCols) => {
      // Using array's map to process matrixCols
      return pipe(
        matrixCols,
        RA.mapWithIndex((columnIndex, matrixColumn) => {
          const last =
            columnIndex === 0 ? null : positionedCols[positionedCols.length - 1]

          const z = !last
            ? 0
            : last.z +
              last.positionedRows[0].positionedModules.reduce(
                (modulesLength, module) => modulesLength + module.module.length,
                0
              )

          // Using array's map to process matrixRow
          return pipe(
            matrixColumn,
            A.mapWithIndex((levelIndex, matrixRow) => {
              const {
                systemId,
                structuredDna: {
                  sectionType,
                  positionType,
                  levelType,
                  gridType,
                },
              } = matrixRow[0]
              const levelLetter = levelType[0]

              console.log({ levelLetter, positionedCols })
              const y =
                levelLetter === "F"
                  ? 0
                  : positionedCols[positionedCols.length - 1].positionedRows[0]
                      .y +
                    positionedCols[positionedCols.length - 1].positionedRows[0]
                      .positionedModules[0].module.height

              return pipe(
                getVanillaModule({
                  systemId,
                  sectionType,
                  positionType,
                  levelType,
                  gridType,
                }),
                T.map((vanillaModule): PositionedRow => {
                  return {
                    positionedModules: pipe(
                      matrixRow,
                      A.reduceWithIndex(
                        [],
                        (i, positionedModules: PositionedModule[], module) => {
                          const isFirst = i === 0
                          const z = isFirst
                            ? module.length / 2
                            : positionedModules[i - 1].z +
                              positionedModules[i - 1].module.length / 2 +
                              module.length / 2
                          return [
                            ...positionedModules,
                            { module, gridGroupIndex: i, z },
                          ]
                        }
                      )
                    ),
                    levelIndex,
                    levelType,
                    y,
                    length: matrixRow.reduce((acc, m) => acc + m.length, 0),
                    vanillaModule,
                  }
                })
              )
            }),
            T.sequenceArray, // This will transform array of Tasks to Task of array
            T.map((positionedRows) => {
              positionedCols.push({
                columnIndex: matrixCols.indexOf(matrixColumn),
                positionedRows: [...positionedRows],
                z,
                length: positionedRows[0].length,
              })
              return positionedCols
            })
          )
        }),
        T.sequenceArray // Transforming the outer array of Tasks to a single Task
      )
    }),
    T.map((xs) => pipe([...xs], pipeLog, A.flatten))
  )
}

export const splitColumns = (layout: ColumnLayout) =>
  pipe(
    layout,
    A.partition(
      ({ columnIndex }) =>
        columnIndex === 0 || columnIndex === layout.length - 1
    ),
    ({ left: midColumns, right: [startColumn, endColumn] }) => ({
      startColumn,
      endColumn,
      midColumns,
    })
  )

// also posts vanilla columns
const getLayout = async ({
  systemId,
  dnas,
}: HouseLayoutsKey): Promise<ColumnLayout> => {
  const allModules = await getModules()

  const maybeLayout = await layoutsDB.houseLayouts
    .get({ systemId, dnas })
    .then((x) => x?.layout)

  if (maybeLayout) {
    return maybeLayout
  } else {
    const modules = pipe(
      dnas,
      A.filterMap((dna) =>
        pipe(
          allModules,
          A.findFirst(
            (systemModule: Module) =>
              systemModule.systemId === systemId && systemModule.dna === dna
          )
        )
      )
    )
    const layout = await modulesToColumnLayout(modules)()

    layoutsDB.houseLayouts.put({
      layout,
      systemId,
      dnas,
    })

    const { startColumn } = splitColumns(layout)

    postVanillaColumn(startColumn)

    return layout
  }
}

if (!isSSR()) {
  liveQuery(() => systemsDB.houseTypes.toArray()).subscribe((houseTypes) => {
    for (let houseType of houseTypes) {
      getLayout(houseType)
    }
  })
}

export const columnLayoutToDnas = (
  columnLayout: Omit<PositionedColumn, "length" | "z" | "columnIndex">[]
) =>
  pipe(
    columnLayout,
    RA.map(({ positionedRows: gridGroups }) =>
      pipe(
        gridGroups,
        RA.map(({ positionedModules: modules }) =>
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

const changeLayoutSectionType = async ({
  systemId,
  layout,
  sectionType: st,
}: {
  systemId: string
  layout: ColumnLayout
  sectionType: SectionType
}) => {
  const { code: sectionType } = st

  const allModules = await getModules()

  return pipe(
    layout,
    A.traverse(TO.ApplicativeSeq)((positionedColumn) =>
      pipe(
        positionedColumn.positionedRows,
        A.traverse(TO.ApplicativeSeq)((gridGroup) => {
          const {
            positionedModules: modules,
            positionedModules: [
              {
                module: {
                  // we just destructure the first module for this data
                  structuredDna: { levelType, positionType, gridType },
                },
              },
            ],
          } = gridGroup

          const vanillaModuleTask: TO.TaskOption<Module> = pipe(
            TO.fromTask(
              getIndexedVanillaModule({
                systemId,
                sectionType,
                positionType,
                levelType,
                gridType,
              })
            ),
            TO.chainOptionK(
              flow(
                O.fromNullable,
                O.chain((a) =>
                  pipe(
                    allModules,
                    A.findFirst(
                      (b) => a.systemId === b.systemId && a.moduleDna === b.dna
                    )
                  )
                )
              )
            )
          )

          return pipe(
            vanillaModuleTask,
            TO.chain((vanillaModule) =>
              pipe(
                modules,
                reduceToOption(
                  O.some([]),
                  (i, acc: O.Option<PositionedModule[]>, positionedModule) => {
                    // target is existent module with target section type
                    const target = {
                      systemId,
                      structuredDna: {
                        ...positionedModule.module.structuredDna,
                        sectionType: st.code,
                      },
                    } as Module

                    const compatModules = pipe(
                      allModules,
                      filterCompatibleModules()(target)
                    )

                    if (compatModules.length === 0) return O.none

                    return pipe(
                      compatModules,
                      topCandidateByHamming(target),
                      O.map((bestModule) => {
                        const distanceToTarget =
                          target.structuredDna.gridUnits -
                          bestModule.structuredDna.gridUnits
                        switch (true) {
                          case sign(distanceToTarget) > 0:
                            // fill in some vanilla
                            return [
                              bestModule,
                              ...A.replicate(
                                distanceToTarget / vanillaModule.length,
                                vanillaModule
                              ),
                            ]
                          case sign(distanceToTarget) < 0:
                            // abort and only vanilla
                            return A.replicate(
                              positionedModule.module.length /
                                vanillaModule.length,
                              vanillaModule
                            )

                          case sign(distanceToTarget) === 0:
                          default:
                            return [bestModule]
                          // swap the module
                        }
                      }),
                      O.map((nextModules) =>
                        pipe(
                          acc,
                          O.map((positionedModules) => [
                            ...positionedModules,
                            ...nextModules.map(
                              (module, i) =>
                                ({
                                  module,
                                  z: positionedModule.z,
                                  gridGroupIndex: i,
                                } as PositionedModule)
                            ),
                          ])
                        )
                      ),
                      O.flatten
                    )
                  }
                ),
                O.map(
                  (modules): PositionedRow => ({
                    ...gridGroup,
                    positionedModules: modules,
                  })
                ),
                TO.fromOption
              )
            )
          )
        }),
        TO.map((gridGroups) => ({
          ...positionedColumn,
          gridGroups,
        }))
      )
    )
  )()
}

const getAltSectionTypeLayouts = async ({
  systemId,
  dnas,
  currentSectionType,
}: {
  systemId: string
  dnas: string[]
  currentSectionType: string
}) => {
  const currentIndexedLayout = await layoutsDB.houseLayouts.get({
    systemId,
    dnas,
  })

  if (!currentIndexedLayout)
    throw new Error(`no currentLayout for ${systemId} ${dnas}`)

  const sectionTypes = await systemsDB.sectionTypes.toArray()

  const otherSectionTypes = sectionTypes.filter(
    (x) => x.systemId === systemId && x.code !== currentSectionType
  )

  return pipe(
    otherSectionTypes,
    A.map(
      (
          sectionType
        ): TO.TaskOption<{
          layout: ColumnLayout
          sectionType: SectionType
          dnas: string[]
        }> =>
        () =>
          changeLayoutSectionType({
            systemId,
            layout: currentIndexedLayout.layout,
            sectionType,
          }).then(
            O.map((layout) => {
              postVanillaColumn(layout[0])
              const dnas = columnLayoutToDnas(layout)
              layoutsDB.houseLayouts.put({ systemId, dnas, layout })
              return {
                layout,
                sectionType,
                dnas,
              }
            })
          )
    ),
    A.sequence(T.ApplicativeSeq),
    unwrapSome,
    (x) => x
  )()
}

const getChangeLayoutTypeLayout = async ({
  systemId,
  layout,
  prevLevelType,
  nextLevelType,
  levelIndex,
}: {
  systemId: string
  layout: ColumnLayout
  nextLevelType: LevelType
  prevLevelType: LevelType
  levelIndex: number
}) => {
  const dh = nextLevelType.height - prevLevelType.height

  const allModules = await getModules()

  return pipe(
    layout,
    A.traverse(TO.ApplicativeSeq)((positionedColumn) =>
      pipe(
        positionedColumn.positionedRows,
        A.traverse(TO.ApplicativeSeq)((gridGroup) => {
          if (gridGroup.levelIndex !== levelIndex)
            return TO.of({
              ...gridGroup,
              y:
                gridGroup.levelIndex > levelIndex
                  ? gridGroup.y + dh
                  : gridGroup.y,
            })

          const {
            positionedModules: modules,
            positionedModules: [
              {
                module: {
                  structuredDna: { sectionType, positionType, gridType },
                },
              },
            ],
          } = gridGroup

          const vanillaModuleTask: TO.TaskOption<Module> = pipe(
            TO.fromTask(
              getIndexedVanillaModule({
                systemId,
                sectionType,
                positionType,
                levelType: nextLevelType.code,
                gridType,
              })
            ),
            TO.chainOptionK(
              flow(
                O.fromNullable,
                O.chain((vanillaModule) => {
                  return pipe(
                    allModules,
                    A.findFirst(
                      (b) =>
                        vanillaModule.systemId === b.systemId &&
                        vanillaModule.moduleDna === b.dna
                    )
                  )
                })
              )
            )
          )

          return pipe(
            vanillaModuleTask,
            TO.chain((vanillaModule) =>
              pipe(
                modules,
                reduceToOption(
                  O.some([]),
                  (i, acc: O.Option<PositionedModule[]>, positionedModule) => {
                    const target = {
                      systemId,
                      structuredDna: {
                        ...positionedModule.module.structuredDna,
                        levelType: nextLevelType.code,
                      },
                    } as Module

                    const compatModules = pipe(
                      allModules,
                      filterCompatibleModules()(target)
                    )

                    if (compatModules.length === 0) return O.none

                    return pipe(
                      compatModules,
                      topCandidateByHamming(target),
                      O.map((bestModule) => {
                        const distanceToTarget =
                          target.structuredDna.gridUnits -
                          bestModule.structuredDna.gridUnits

                        switch (true) {
                          case sign(distanceToTarget) > 0:
                            // fill in some vanilla
                            return [
                              bestModule,
                              ...A.replicate(
                                distanceToTarget / vanillaModule.length,
                                vanillaModule
                              ),
                            ]
                          case sign(distanceToTarget) < 0:
                            // abort and only vanilla
                            return A.replicate(
                              positionedModule.module.length /
                                vanillaModule.length,
                              vanillaModule
                            )

                          case sign(distanceToTarget) === 0:
                          default:
                            return [bestModule]
                          // swap the module
                        }
                      }),
                      O.map((nextModules) =>
                        pipe(
                          acc,
                          O.map((positionedModules) => [
                            ...positionedModules,
                            ...nextModules.map(
                              (module, i) =>
                                ({
                                  module,
                                  z: positionedModule.z,
                                  gridGroupIndex: i,
                                } as PositionedModule)
                            ),
                          ])
                        )
                      ),
                      O.flatten
                    )
                  }
                ),
                O.map((modules): PositionedRow => {
                  return {
                    ...gridGroup,
                    levelType: nextLevelType.code,
                    positionedModules: modules,
                  }
                }),
                TO.fromOption
              )
            )
          )
        }),
        TO.map((gridGroups) => ({
          ...positionedColumn,
          gridGroups,
        }))
      )
    )
  )()
}

const getAltLevelTypeLayouts = async ({
  systemId,
  dnas,
  currentLevelTypeCode,
  levelIndex,
}: {
  systemId: string
  dnas: string[]
  currentLevelTypeCode: string
  levelIndex: number
}) => {
  const currentIndexedLayout = await layoutsDB.houseLayouts.get({
    systemId,
    dnas,
  })

  if (!currentIndexedLayout)
    throw new Error(`no currentLayout for ${systemId} ${dnas}`)

  const levelTypes = await systemsDB.levelTypes.toArray()

  const { otherLevelTypes, currentLevelType } = pipe(
    levelTypes,
    A.partition((x) => x.code !== currentLevelTypeCode),
    ({ left: currentLevelTypes, right: otherLevelTypes }) =>
      pipe(
        currentLevelTypes,
        A.head,
        someOrError(`couldn't head currentLevelTypes`),
        (currentLevelType) => ({
          otherLevelTypes: otherLevelTypes.filter(
            (x) => x.code[0] === currentLevelType.code[0]
          ),
          currentLevelType,
        })
      )
  )

  return pipe(
    otherLevelTypes,
    A.map(
      (
          levelType
        ): TO.TaskOption<{
          layout: ColumnLayout
          levelType: LevelType
          dnas: string[]
        }> =>
        () =>
          getChangeLayoutTypeLayout({
            systemId,
            layout: currentIndexedLayout.layout,
            nextLevelType: levelType,
            prevLevelType: currentLevelType,
            levelIndex,
          }).then(
            O.map((layout) => {
              postVanillaColumn(layout[0])
              const dnas = columnLayoutToDnas(layout)
              layoutsDB.houseLayouts.put({ systemId, dnas, layout })
              return {
                layout,
                levelType,
                dnas,
              }
            })
          )
    ),
    A.sequence(T.ApplicativeSeq),
    unwrapSome,
    (x) => x
  )()
}

export const getWindowType = (
  windowTypes: WindowType[],
  candidate: Module,
  side: Side
) =>
  pipe(
    windowTypes,
    A.findFirst((windowType) => {
      switch (true) {
        // special case end modules
        case candidate.structuredDna.positionType === "END":
          return windowType.code === candidate.structuredDna.windowTypeEnd
        // left = windowTypeSide2
        case side === "LEFT":
          return windowType.code === candidate.structuredDna.windowTypeSide1
        // right = windowTypeSide1
        case side === "RIGHT":
          return windowType.code === candidate.structuredDna.windowTypeSide2
        default:
          return false
      }
    })
  )

const getAltWindowTypeLayouts = async ({
  systemId,
  dnas,
  columnIndex,
  levelIndex,
  gridGroupIndex,
  side,
}: {
  systemId: string
  dnas: string[]
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
  side: Side
}) => {
  // const allModules = await getModules()
  const windowTypes = await systemsDB.windowTypes.where({ systemId }).toArray()

  const currentIndexedLayout = await layoutsDB.houseLayouts.get({
    systemId,
    dnas,
  })

  if (!currentIndexedLayout)
    throw new Error(`no currentLayout for ${systemId} ${dnas}`)

  const { layout: currentLayout } = currentIndexedLayout

  const thisColumn = pipe(
    currentLayout,
    A.lookup(columnIndex),
    someOrError(`no column`)
  )

  const thisModule = pipe(
    thisColumn.positionedRows,
    A.lookup(levelIndex),
    O.chain((x) => pipe(x.positionedModules, A.lookup(gridGroupIndex))),
    someOrError(`no module`)
  )

  const {
    dna,
    structuredDna: { sectionType, positionType, levelType, gridType },
  } = thisModule.module

  const vanillaModulesByLevelIndex = await pipe(
    thisColumn.positionedRows,
    A.map((posRow) =>
      pipe(
        getVanillaModule({
          systemId,
          sectionType,
          positionType,
          levelType: posRow.levelType,
          gridType,
        })
      )
    ),
    A.sequence(T.ApplicativeSeq) // Convert Array<Task<T>> to Task<Array<T>>
  )()

  const candidates = pipe(
    await getWindowTypeAlternatives({ systemId, dna, side }),
    A.map((candidate) => {
      const gridUnitDelta =
        candidate.structuredDna.gridUnits -
        thisModule.module.structuredDna.gridUnits

      const lengthDelta = candidate.length - thisModule.module.length

      const updatedColumn = pipe(
        thisColumn,
        produce((draft: PositionedColumn) => {
          const mainPosRow = draft.positionedRows[levelIndex]

          const mainGridGroup = mainPosRow.positionedModules[gridGroupIndex]

          // swap the module
          mainGridGroup.module = candidate

          const isFirst: boolean = gridGroupIndex === 0

          mainGridGroup.z = isFirst
            ? candidate.length / 2
            : mainPosRow.positionedModules[gridGroupIndex - 1].z +
              mainPosRow.positionedModules[gridGroupIndex - 1].module.length /
                2 +
              candidate.length / 2

          for (
            let i = gridGroupIndex;
            i < mainPosRow.positionedModules.length;
            i++
          ) {
            // might be lengthDelta/2?
            draft.positionedRows[levelIndex].positionedModules[i].z +=
              lengthDelta
          }

          draft.positionedRows[levelIndex].length += lengthDelta

          const check = () => {
            // I want to write this check function that checks that the
            // lengths of the levels (gridGroups) in the column
            // are consistent
            // to log out the length of each
            return false
          }

          switch (sign(gridUnitDelta)) {
            // pad every other level
            case 1: {
              for (let posRow of draft.positionedRows) {
                if (posRow.levelIndex === levelIndex) continue

                const vanillaModule =
                  vanillaModulesByLevelIndex[posRow.levelIndex]

                const n = round(lengthDelta / vanillaModule.length)

                let { gridGroupIndex: initialGridGroupIndex, z: initialZ } =
                  pipe(
                    posRow.positionedModules,
                    A.last,
                    O.map(({ gridGroupIndex, z }) => ({ gridGroupIndex, z })),
                    O.getOrElse(() => ({ gridGroupIndex: 0, z: 0 }))
                  )

                for (
                  let i = initialGridGroupIndex;
                  i <= initialGridGroupIndex + n;
                  i++
                ) {
                  // might be lengthDelta/2?
                  posRow.positionedModules[i].z += lengthDelta
                }

                draft.positionedRows[levelIndex].length += lengthDelta

                // console.log(`before`, gridGroup)

                // z wants to be z so far + ...
                // gridGroupIndex wants to be so far + ...

                // gridGroup.gridGroups.concat(
                //   pipe(
                //     A.replicate(n, vanillaModule),
                //     A.mapWithIndex((i, module) => ({
                //       gridGroupIndex: initialGridGroupIndex + i,
                //       module,
                //       z: initialZ + i * vanillaModule.length,
                //     }))
                //   )
                // )

                // gridGroup.length = gridGroup.gridGroups.reduce(
                //   (acc, v) => acc + v.module.length,
                //   0
                // )

                // console.log(`after`, gridGroup)
              }
              break
            }

            // pad this level
            case -1: {
              const vanillaModule = vanillaModulesByLevelIndex[levelIndex]

              const n = round(vanillaModule.length / gridUnitDelta)

              let { gridGroupIndex: initialGridGroupIndex, z: initialZ } = pipe(
                draft.positionedRows[levelIndex].positionedModules,
                A.last,
                O.map(({ gridGroupIndex, z }) => ({ gridGroupIndex, z })),
                O.getOrElse(() => ({ gridGroupIndex: 0, z: 0 }))
              )

              draft.positionedRows[levelIndex].positionedModules.concat(
                pipe(
                  A.replicate(n, vanillaModule),
                  A.mapWithIndex((i, module) => ({
                    gridGroupIndex: initialGridGroupIndex + i,
                    module,
                    z: initialZ + i * vanillaModule.length,
                  }))
                )
              )
              break
            }

            // do nothing more
            case 0:
            default:
              break
          }
        })
      )

      const layout = pipe(
        currentLayout,
        produce((draft: ColumnLayout) => {
          draft[columnIndex] = updatedColumn
        })
      )

      postVanillaColumn(layout[0])
      const dnas = columnLayoutToDnas(layout)

      // layoutsDB.houseLayouts.put({ systemId, dnas, layout })

      return {
        candidate,
        layout,
        dnas,
        windowType: pipe(
          getWindowType(windowTypes, candidate, side),
          someOrError(`no window type`)
        ),
      }
    })
  )

  return candidates
}

// const getChangeWindowTypeLayout = async ({
//   systemId,
//   layout,
//   columnIndex,
//   levelIndex,
//   gridGroupIndex,
// }: {
//   systemId: string
//   layout: ColumnLayout
//   columnIndex: number
//   levelIndex: number
//   gridGroupIndex: number
// }) => {
//   const allModules = await getModules()

//   const maybeThisModule = pipe(
//     layout,
//     A.lookup(columnIndex),
//     O.chain((x) =>
//       pipe(
//         x.gridGroups,
//         A.lookup(levelIndex),
//         O.chain((x) => pipe(x.modules, A.lookup(gridGroupIndex)))
//       )
//     )
//   )

//   pipe(
//     maybeThisModule,
//     O.map((thisModule) => {})
//   )

//   return pipe(
//     layout,
//     A.traverse(TO.ApplicativeSeq)((positionedColumn) =>
//       pipe(
//         positionedColumn.gridGroups,
//         A.traverse(TO.ApplicativeSeq)((gridGroup) => {
//           // if (gridGroup.levelIndex !== levelIndex)
//           //   return TO.of({
//           //     ...gridGroup,
//           //     y:
//           //       gridGroup.levelIndex > levelIndex
//           //         ? gridGroup.y + dh
//           //         : gridGroup.y,
//           //   })

//           const {
//             modules,
//             modules: [
//               {
//                 module: {
//                   structuredDna: { sectionType, positionType, gridType },
//                 },
//               },
//             ],
//           } = gridGroup

//           const vanillaModuleTask: TO.TaskOption<Module> = pipe(
//             TO.fromTask(() =>
//               getIndexedVanillaModule({
//                 systemId,
//                 sectionType,
//                 positionType,
//                 levelType: nextLevelType.code,
//                 gridType,
//               })
//             ),
//             TO.chainOptionK(
//               flow(
//                 O.fromNullable,
//                 O.chain((vanillaModule) => {
//                   return pipe(
//                     allModules,
//                     A.findFirst(
//                       (b) =>
//                         vanillaModule.systemId === b.systemId &&
//                         vanillaModule.moduleDna === b.dna
//                     )
//                   )
//                 })
//               )
//             )
//           )

//           return pipe(
//             vanillaModuleTask,
//             TO.chain((vanillaModule) =>
//               pipe(
//                 modules,
//                 reduceToOption(
//                   O.some([]),
//                   (i, acc: O.Option<PositionedModule[]>, positionedModule) => {
//                     const target = {
//                       systemId,
//                       structuredDna: {
//                         ...positionedModule.module.structuredDna,
//                         levelType: nextLevelType.code,
//                       },
//                     } as Module

//                     const compatModules = pipe(
//                       allModules,
//                       filterCompatibleModules()(target)
//                     )

//                     if (compatModules.length === 0) return O.none

//                     return pipe(
//                       compatModules,
//                       topCandidateByHamming(target),
//                       O.map((bestModule) => {
//                         const distanceToTarget =
//                           target.structuredDna.gridUnits -
//                           bestModule.structuredDna.gridUnits

//                         switch (true) {
//                           case sign(distanceToTarget) > 0:
//                             // fill in some vanilla
//                             return [
//                               bestModule,
//                               ...A.replicate(
//                                 distanceToTarget / vanillaModule.length,
//                                 vanillaModule
//                               ),
//                             ]
//                           case sign(distanceToTarget) < 0:
//                             // abort and only vanilla
//                             return A.replicate(
//                               positionedModule.module.length /
//                                 vanillaModule.length,
//                               vanillaModule
//                             )

//                           case sign(distanceToTarget) === 0:
//                           default:
//                             return [bestModule]
//                           // swap the module
//                         }
//                       }),
//                       O.map((nextModules) =>
//                         pipe(
//                           acc,
//                           O.map((positionedModules) => [
//                             ...positionedModules,
//                             ...nextModules.map(
//                               (module, i) =>
//                                 ({
//                                   module,
//                                   z: positionedModule.z,
//                                   gridGroupIndex: i,
//                                 } as PositionedModule)
//                             ),
//                           ])
//                         )
//                       ),
//                       O.flatten
//                     )
//                   }
//                 ),
//                 O.map((modules): GridGroup => {
//                   return {
//                     ...gridGroup,
//                     levelType: nextLevelType.code,
//                     modules,
//                   }
//                 }),
//                 TO.fromOption
//               )
//             )
//           )
//         }),
//         TO.map((gridGroups) => ({
//           ...positionedColumn,
//           gridGroups,
//         }))
//       )
//     )
//   )()
// }

const getVanillaColumn = async (key: VanillaColumnsKey) => {
  const maybeVanillaColumn = await layoutsDB.vanillaColumns.get(key)

  if (maybeVanillaColumn) {
    return maybeVanillaColumn.vanillaColumn
  } else {
    throw new Error(`No vanilla column found for ${JSON.stringify(key)}`)
  }
}

const api = {
  getLayout,
  getVanillaColumn,
  getAltSectionTypeLayouts,
  getAltLevelTypeLayouts,
  getAltWindowTypeLayouts,
}

export type LayoutsAPI = typeof api

expose(api)
