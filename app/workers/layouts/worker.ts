import { expose } from "comlink"
import { liveQuery } from "dexie"
import { transpose as transposeRA } from "fp-ts-std/ReadonlyArray"
import { flow, identity, pipe } from "fp-ts/lib/function"
import * as RA from "fp-ts/ReadonlyArray"
import produce from "immer"
import { Module } from "../../../server/data/modules"
import { SectionType } from "../../../server/data/sectionTypes"
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
  getHouseLayoutsKey,
  GridGroup,
  IndexedVanillaModule,
} from "../../db/layouts"
import systemsDB, { LastFetchStamped } from "../../db/systems"
import userDB from "../../db/user"
import { AugSectionType } from "../../design/ui-3d/grouped/stretchWidth/StretchWidth"
import {
  A,
  mapToOption,
  Num,
  O,
  Ord,
  reduceToOption,
  TO,
} from "../../utils/functions"
import { sign } from "../../utils/math"
import { isSSR } from "../../utils/next"
import { syncModels } from "./models"
import { createVanillaModuleGetter, getIndexedVanillaModule } from "./vanilla"

let modulesCache: LastFetchStamped<Module>[] = []
let layoutsQueue: HouseLayoutsKey[] = []

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
  const maybeLayout = await layoutsDB.houseLayouts
    .get(getHouseLayoutsKey({ systemId, dnas }))
    .then((x) => x?.layout)

  if (maybeLayout) {
    return maybeLayout
  } else {
    const modules = pipe(
      dnas,
      A.filterMap((dna) =>
        pipe(
          modulesCache,
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

    const {
      startColumn: { gridGroups },
    } = splitColumns(layout)

    const getVanillaModule = createVanillaModuleGetter(modulesCache)({
      constrainGridType: false,
      positionType: "MID",
    })

    pipe(
      gridGroups,
      A.traverse(O.Applicative)(
        ({
          levelIndex,
          levelType,
          y,
          modules: [{ module }],
        }): O.Option<PositionedRow> =>
          pipe(
            module,
            getVanillaModule,
            O.map((vanillaModule) => ({
              modules: [
                {
                  module: vanillaModule,
                  gridGroupIndex: 0,
                  z: 0,
                },
              ],
              length: vanillaModule.length,
              y,
              levelIndex,
              levelType,
            }))
          )
      ),
      O.map((gridGroups) => {
        const levelTypes = pipe(
          gridGroups,
          A.map((gridGroup) => gridGroup.levelType)
        )

        layoutsDB.vanillaColumns.put({
          systemId,
          levelTypes,
          vanillaColumn: {
            gridGroups,
            length: gridGroups[0].length,
          },
        })
      })
    )

    return layout
  }
}

const processLayoutsQueue = async () => {
  if (modulesCache.length === 0) {
    return
  }

  // Process queue one item at a time
  while (layoutsQueue.length > 0) {
    const layoutsKey = layoutsQueue.shift()
    if (layoutsKey) {
      await getLayout(layoutsKey)
    }
  }
}

if (!isSSR()) {
  liveQuery(() => systemsDB.modules.toArray()).subscribe((modules) => {
    syncModels(modules)
    modulesCache = modules
    processLayoutsQueue()
  })
}

const postLayout = (key: HouseLayoutsKey) => {
  layoutsQueue.push(key)
}

const postLayouts = (keys: HouseLayoutsKey[]) => {
  keys.map(postLayout)
}

if (!isSSR()) {
  liveQuery(() => systemsDB.houseTypes.toArray()).subscribe((houseTypes) => {
    postLayouts(houseTypes)
    processLayoutsQueue()
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

const processZStretchLayout = async ({
  layoutKey,
  direction,
  i,
}: {
  layoutKey: HouseLayoutsKey
  direction: number
  i: number
}) => {
  const { systemId } = layoutKey
  const strLayoutKey = getHouseLayoutsKey(layoutKey)
  const layout = await layoutsDB.houseLayouts.get(strLayoutKey)
  if (!layout) {
    console.log(`no layout for ${strLayoutKey}`)
    return
  }
  const vanillaColumn = await layoutsDB.vanillaColumns.get(strLayoutKey)
  if (!vanillaColumn) {
    console.log(`no layout for ${strLayoutKey}`)
    return
  }

  const { startColumn, midColumns, endColumn } = splitColumns(layout.layout)

  const nextDnas = columnLayoutToDnas([
    startColumn,
    ...A.replicate(i, vanillaColumn.vanillaColumn),
    ...midColumns,
    endColumn,
  ])

  getLayout({
    systemId,
    dnas: nextDnas,
  })
}

if (!isSSR()) {
  // CONT
  liveQuery(async () => {
    const houses = await userDB.houses.toArray()
    const sectionTypes = await systemsDB.sectionTypes.toArray()

    return { houses, sectionTypes }
  }).subscribe(async ({ houses, sectionTypes }) => {
    // for each house, for each section type

    for (const house of houses) {
      const { systemId, dnas, id: houseId } = house

      const layout = await getLayout({ systemId, dnas })

      // CONT
      // getOrPutLayout({ systemId, dnas })

      // for (const { code } of sectionTypes) {
      // if (!(dnas[0] === code)) {
      //   console.log(`dnas[0] === code`)
      //   continue
      // }
      // dnas -> new sectionType
      // skip if code in dnas

      const otherSectionTypes = sectionTypes.filter(
        (x) =>
          x.code !==
          layout[0].gridGroups[0].modules[0].module.structuredDna.sectionType
      )

      const changeLayoutSectionType = (
        layout: ColumnLayout,
        st: SectionType
      ) => {
        const { code: sectionType } = st

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
                          modulesCache,
                          A.findFirst(
                            (b) =>
                              a.systemId === b.systemId && a.moduleDna === b.dna
                          )
                        )
                      )
                    )
                  )
                )
                // what must I do?

                return pipe(
                  vanillaModuleTask,
                  TO.chain((vanillaModule) =>
                    pipe(
                      modules,
                      reduceToOption(
                        O.some([]),
                        (
                          i,
                          acc: O.Option<PositionedModule[]>,
                          positionedModule
                        ) => {
                          // target is existent module with target section type
                          const target = {
                            structuredDna: {
                              ...positionedModule.module.structuredDna,
                              sectionType: st.code,
                            },
                          } as Module

                          const compatModules = pipe(
                            modulesCache,
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
                      TO.fromOption
                    )
                  )
                )
              })
            )
          )
        )
      }

      //                     }
      //                   ),
      //                   O.map(
      //                     (modules): GridGroup => ({
      //                       ...gridGroupRest,
      //                       modules,
      //                     })
      //                   )
      //                 )
      //               } catch (e) {
      //                 return O.none
      //               }
      //             }
      //           ),
      //           O.map((gridGroups) => ({
      //             ...columnRest,
      //             gridGroups,
      //           }))
      //         )
      //     ),
      //     O.map((columnLayout): AugSectionType => {
      //       const houseDna = columnLayoutToDnas(columnLayout)
      //       return {
      //         ...st,
      //         dx: (st.width - houseWidth) / 2,
      //         houseDna,
      //         houseDnaKey: houseDna.toString(),
      //       }
      //     })
      //   )
      // ),
      // A.sort(
      //   pipe(
      //     Num.Ord,
      //     Ord.contramap((st: AugSectionType) => st.width)
      //   )
      // ),
      // (as) =>
      //   A.isNonEmpty(as)
      //     ? as
      //     : ((): any => {
      //         throw new Error("empty section types")
      //       })()
      // )
      // }
    }
  })
}

const getStretchXLayout = (houseId: string, sectionType: string) => {
  // check if already there
  // if then return
  // else get and return
}

const getStretchXPreviews = (houseId: string, currentSectionType: string) => {
  return { foo: "bar" }
}

const api = {
  postLayout,
  postLayouts,
  processLayout: getLayout,
  processZStretchLayout,
  // getStretchXLayout,
  getStretchXPreviews,
  syncModels,
}

export type LayoutsAPI = typeof api

expose(api)
