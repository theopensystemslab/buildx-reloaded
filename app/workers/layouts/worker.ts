import { expose } from "comlink"
import { liveQuery } from "dexie"
import { transpose as transposeA } from "fp-ts-std/Array"
import { flow, pipe } from "fp-ts/lib/function"
import produce from "immer"
import { LevelType } from "../../../server/data/levelTypes"
import { Module } from "../../../server/data/modules"
import { SectionType } from "../../../server/data/sectionTypes"
import { WindowType } from "../../../server/data/windowTypes"
import { filterCompatibleModules, topCandidateByHamming } from "~/utils/modules"
import layoutsDB, {
  ColumnLayout,
  HouseLayoutsKey,
  PositionedColumn,
  PositionedModule,
  PositionedRow,
  VanillaColumnsKey,
  createColumnLayout,
  modifyColumnAt,
  modifyLayoutAt,
  positionColumns,
} from "../../db/layouts"
import systemsDB from "../../db/systems"
import { Side } from "../../design/state/camera"
import {
  A,
  O,
  T,
  TO,
  reduceToOption,
  someOrError,
  unwrapSome,
} from "../../utils/functions"
import { round, sign } from "../../utils/math"
import { isSSR } from "../../utils/next"
import { getModules, getModuleWindowTypeAlts } from "./modules"
import { getIndexedVanillaModule, postVanillaColumn } from "./vanilla"

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
    A.filterMapWithIndex((i, m) =>
      m.structuredDna.positionType === "END" ? O.some(i) : O.none
    ),
    A.filterWithIndex((i) => i % 2 === 0)
  )

  return pipe(
    modules,
    A.reduceWithIndex(
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
  (as: A[][]) => {
    return pipe(
      as,
      A.reduceWithIndex(
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

const modulesToMatrix = (modules: Module[]): Module[][][] => {
  const columns = pipe(
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
    columns,
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

  return pipe(
    columns,
    A.map((column) =>
      pipe(
        column,
        columnify((a) => a.structuredDna.gridUnits),
        transposeA
      )
    ),
    A.flatten
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

    const layout = await pipe(modules, modulesToMatrix, createColumnLayout)()

    layoutsDB.houseLayouts.put({
      layout,
      systemId,
      dnas,
    })

    const { startColumn } = splitColumns(layout)

    await postVanillaColumn(startColumn)()

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
    A.map(({ positionedRows }) =>
      pipe(
        positionedRows,
        A.map(({ positionedModules }) =>
          pipe(
            positionedModules,
            A.map(({ module }) => module.dna)
          )
        )
      )
    ),
    transposeA,
    A.flatten,
    A.flatten
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
                                round(distanceToTarget / vanillaModule.length),
                                vanillaModule
                              ),
                            ]
                          case sign(distanceToTarget) < 0:
                            // abort and only vanilla
                            return A.replicate(
                              round(
                                positionedModule.module.length /
                                  vanillaModule.length
                              ),
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
                              (module, i): PositionedModule => ({
                                module,
                                z: positionedModule.z,
                                moduleIndex: i,
                              })
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
        TO.map((positionedRows) => {
          return {
            ...positionedColumn,
            positionedRows,
          }
        })
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
  const layout = await getLayout({ systemId, dnas })

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
            layout,
            sectionType,
          }).then(
            O.map((layout) => {
              postVanillaColumn(layout[0])()
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

const getChangeLevelTypeLayout = async ({
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
                                round(distanceToTarget / vanillaModule.length),
                                vanillaModule
                              ),
                            ]
                          case sign(distanceToTarget) < 0:
                            // abort and only vanilla
                            return A.replicate(
                              round(
                                positionedModule.module.length /
                                  vanillaModule.length
                              ),
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
                              (module, i): PositionedModule => ({
                                module,
                                z: positionedModule.z,
                                moduleIndex: i,
                              })
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
        TO.map((positionedRows) => ({
          ...positionedColumn,
          positionedRows,
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
          getChangeLevelTypeLayout({
            systemId,
            layout: currentIndexedLayout.layout,
            nextLevelType: levelType,
            prevLevelType: currentLevelType,
            levelIndex,
          }).then(
            O.map((layout) => {
              postVanillaColumn(layout[0])()
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

export const stripForDebug = (posCol: PositionedColumn) => {
  const { positionedRows, ...restCol } = posCol

  return {
    ...restCol,
    positionedRows: pipe(
      positionedRows,
      A.map(({ positionedModules, vanillaModule, ...restRow }) => ({
        ...restRow,
        positionedModules: pipe(
          positionedModules,
          A.map(
            ({
              module: {
                structuredDna: {
                  sectionType,
                  positionType,
                  levelType,
                  gridType,
                  gridUnits,
                },
                dna,
                length,
              },
              ...restPosMod
            }) => ({
              ...restPosMod,
              module: {
                dna,
                structuredDna: {
                  sectionType,
                  positionType,
                  levelType,
                  gridType,
                  gridUnits,
                },
                length,
              },
            })
          )
        ),
      }))
    ),
  }
}

const getAltWindowTypeLayouts = async ({
  systemId,
  dnas,
  columnIndex,
  levelIndex,
  moduleIndex,
  side,
}: {
  systemId: string
  dnas: string[]
  columnIndex: number
  levelIndex: number
  moduleIndex: number
  side: Side
}) => {
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
    O.chain((x) => pipe(x.positionedModules, A.lookup(moduleIndex))),
    someOrError(`no module`)
  )

  const { dna } = thisModule.module

  return await pipe(
    getModuleWindowTypeAlts({ systemId, dna, side }),
    T.chain(
      A.traverse(T.ApplicativeSeq)((candidate) =>
        pipe(
          modifyLayoutAt(
            currentLayout,
            columnIndex,
            levelIndex,
            moduleIndex,
            candidate
          ),
          T.map((layout) => {
            const dnas = columnLayoutToDnas(layout)
            const windowType = pipe(
              getWindowType(windowTypes, candidate, side),
              someOrError(`no window type`)
            )

            layoutsDB.houseLayouts.put({ systemId, dnas, layout })

            return {
              candidate,
              layout,
              dnas,
              windowType,
            }
          })
        )
      )
    )
  )()

  // validatePositionedColumn(augColumn)

  // const candidates: {
  //   candidate: Module
  //   layout: ColumnLayout
  //   dnas: string[]
  //   windowType: WindowType
  // }[] = []

  // const candidates = pipe(
  //   await getWindowTypeAlternatives({ systemId, dna, side }),
  //   A.map((candidate) => {
  //     const updatedColumn = pipe(
  //       augColumn,
  //       produce((draft: AugPosCol) => {
  //         const origRow = draft.positionedRows[levelIndex]
  //         const newRow = swapModuleInRow(origRow, gridGroupIndex, candidate)

  //         const gridUnitDelta = newRow.gridUnits - origRow.gridUnits

  //         if (sign(gridUnitDelta) === 1) {
  //           // pad all other rows with gridUnitDelta vanilla
  //           for (let i = 0; i < draft.positionedRows.length; i++) {
  //             if (i === levelIndex) continue

  //             draft.positionedRows[i] = addModulesToRow(
  //               draft.positionedRows[i],
  //               A.replicate(
  //                 gridUnitDelta,
  //                 draft.positionedRows[i].vanillaModule
  //               )
  //             )
  //             // validatePositionedRow(draft.positionedRows[i])
  //           }
  //           draft.positionedRows[levelIndex] = newRow
  //           // validatePositionedRow(draft.positionedRows[levelIndex])
  //         } else if (sign(gridUnitDelta) === -1) {
  //           // pad this column with gridUnitDelta vanilla
  //           draft.positionedRows[levelIndex] = addModulesToRow(
  //             newRow,
  //             A.replicate(gridUnitDelta, newRow.vanillaModule)
  //           )
  //         }
  //         // validatePositionedRow(draft.positionedRows[levelIndex])

  //         // validatePositionedColumn(draft)
  //       })
  //     )

  //     validatePositionedColumn(updatedColumn)

  //     const lengthDelta =
  //       updatedColumn.positionedRows[0].rowLength - updatedColumn.columnLength

  //     const nextLayout = pipe(
  //       currentLayout,
  //       produce((draft: ColumnLayout) => {
  //         draft[columnIndex] = {
  //           ...updatedColumn,
  //           columnLength: updatedColumn.positionedRows[0].rowLength,
  //         }

  //         for (let i = columnIndex + 1; i < draft.length; i++) {
  //           draft[i] = {
  //             ...draft[i],
  //             z: draft[i].z + lengthDelta,
  //           }
  //         }
  //       })
  //     )

  //     postVanillaColumn(nextLayout[0])
  //     const dnas = columnLayoutToDnas(nextLayout)

  //     layoutsDB.houseLayouts.put({ systemId, dnas, layout: nextLayout })

  //     return {
  //       candidate,
  //       layout: nextLayout,
  //       dnas,
  //       windowType: pipe(
  //         getWindowType(windowTypes, candidate, side),
  //         someOrError(`no window type`)
  //       ),
  //     }
  //   })
  // )
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
