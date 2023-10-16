import { expose } from "comlink"
import { liveQuery } from "dexie"
import { transpose as transposeRA } from "fp-ts-std/ReadonlyArray"
import { flow, pipe } from "fp-ts/lib/function"
import * as RA from "fp-ts/ReadonlyArray"
import produce from "immer"
import { LevelType } from "../../../server/data/levelTypes"
import { Module } from "../../../server/data/modules"
import { SectionType } from "../../../server/data/sectionTypes"
import {
  filterCompatibleModules,
  topCandidateByHamming,
} from "../../data/modules"
import layoutsDB, {
  ColumnLayout,
  GridGroup,
  HouseLayoutsKey,
  PositionedColumn,
  PositionedModule,
  PositionedRow,
  VanillaColumnsKey,
} from "../../db/layouts"
import systemsDB, { LastFetchStamped } from "../../db/systems"
import {
  A,
  O,
  reduceToOption,
  someOrError,
  T,
  TO,
  unwrapSome,
} from "../../utils/functions"
import { sign } from "../../utils/math"
import { isSSR } from "../../utils/next"
import { getModules } from "./modules"
import { getIndexedVanillaModule, postVanillaColumn } from "./vanilla"

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

const modulesToColumnLayout = (modules: Module[]) => {
  const columns = pipe(
    modules,
    modulesToRows,
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

  return pipe(
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
              const y =
                levelLetter === "F"
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
    const layout = modulesToColumnLayout(modules)

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
        positionedColumn.gridGroups,
        A.traverse(TO.ApplicativeSeq)((gridGroup) => {
          const {
            modules,
            modules: [
              {
                module: {
                  // we just destructure the first module for this data
                  structuredDna: { levelType, positionType, gridType },
                },
              },
            ],
          } = gridGroup

          const vanillaModuleTask: TO.TaskOption<Module> = pipe(
            TO.fromTask(() =>
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
                  (modules): GridGroup => ({
                    ...gridGroup,
                    modules,
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

const changeLayoutLevelType = async ({
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
        positionedColumn.gridGroups,
        A.traverse(TO.ApplicativeSeq)((gridGroup) => {
          if (gridGroup.levelIndex < levelIndex)
            return TO.of({
              ...gridGroup,
              y:
                gridGroup.levelIndex > levelIndex
                  ? gridGroup.y + dh
                  : gridGroup.y,
            })

          const {
            modules,
            modules: [
              {
                module: {
                  structuredDna: { sectionType, positionType, gridType },
                },
              },
            ],
          } = gridGroup

          const vanillaModuleTask: TO.TaskOption<Module> = pipe(
            TO.fromTask(() =>
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
                O.map((modules): GridGroup => {
                  return {
                    ...gridGroup,
                    levelType: nextLevelType.code,
                    modules,
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
          changeLayoutLevelType({
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
}

export type LayoutsAPI = typeof api

expose(api)
