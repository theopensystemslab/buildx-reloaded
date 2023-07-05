import { expose } from "comlink"
import { liveQuery } from "dexie"
import { transpose as transposeRA } from "fp-ts-std/ReadonlyArray"
import { pipe } from "fp-ts/lib/function"
import * as RA from "fp-ts/ReadonlyArray"
import produce from "immer"
import { BufferGeometry } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { Module } from "../../server/data/modules"
import { getSpeckleObject } from "../../server/data/speckleModel"
import layoutsDB, { LayoutsKey, serializeLayoutsKey } from "../db/layouts"
import systemsDB, { LastFetchStamped } from "../db/systems"
import { A, all, O, Ord, R, S } from "../utils/functions"
import { isSSR } from "../utils/next"
import speckleIfcParser from "../utils/speckle/speckleIfcParser"

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

export type ModuleIdentifier = {
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
}

export type HouseModuleIdentifier = ModuleIdentifier & {
  houseId: string
}

export type SystemHouseModuleIdentifier = HouseModuleIdentifier & {
  systemId: string
}

export type ColumnLayout = Array<PositionedColumn>
const syncModels = (modules: LastFetchStamped<Module>[]) => {
  modules.map(async (nextModule) => {
    const { speckleBranchUrl, lastFetched } = nextModule
    const maybeModel = await layoutsDB.models.get(speckleBranchUrl)

    if (maybeModel && maybeModel.lastFetched === lastFetched) {
      return
    }

    const speckleObjectData = await getSpeckleObject(speckleBranchUrl)
    const speckleObject = speckleIfcParser.parse(speckleObjectData)
    const geometries = pipe(
      speckleObject,
      A.reduce(
        {},
        (acc: { [e: string]: BufferGeometry[] }, { ifcTag, geometry }) => {
          return produce(acc, (draft) => {
            if (ifcTag in draft) draft[ifcTag].push(geometry)
            else draft[ifcTag] = [geometry]
          })
        }
      ),
      R.map((geoms) => mergeBufferGeometries(geoms)),
      R.filter((bg: BufferGeometry | null): bg is BufferGeometry =>
        Boolean(bg)
      ),
      R.map((x) => x.toJSON())
    )

    layoutsDB.models.put({
      speckleBranchUrl,
      lastFetched,
      geometries,
      systemId: nextModule.systemId,
    })
  })
}

let modulesCache: LastFetchStamped<Module>[] = []
let layoutsQueue: LayoutsKey[] = []

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

const getVanillaModule = (
  module: Module,
  opts: {
    positionType?: string
    levelType?: string
    constrainGridType?: boolean
    sectionType?: string
  } = {}
): O.Option<Module> => {
  const {
    sectionType,
    positionType,
    levelType,
    constrainGridType = true,
  } = opts

  return pipe(
    modulesCache,
    A.filter((sysModule) =>
      all(
        sectionType
          ? sysModule.structuredDna.sectionType === sectionType
          : sysModule.structuredDna.sectionType ===
              module.structuredDna.sectionType,
        positionType
          ? sysModule.structuredDna.positionType === positionType
          : sysModule.structuredDna.positionType ===
              module.structuredDna.positionType,
        levelType
          ? sysModule.structuredDna.levelType === levelType
          : sysModule.structuredDna.levelType ===
              module.structuredDna.levelType,
        !constrainGridType ||
          sysModule.structuredDna.gridType === module.structuredDna.gridType
      )
    ),
    A.sort(
      pipe(
        S.Ord,
        Ord.contramap((m: Module) => m.dna)
      )
    ),
    A.head
  )
}

const processLayout = async ({ systemId, dnas }: LayoutsKey) => {
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

  const layoutsKey = serializeLayoutsKey({ systemId, dnas })

  layoutsDB.layouts.put({
    layout,
    layoutsKey,
  })

  const {
    startColumn: { gridGroups },
  } = splitColumns(layout)

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
          getVanillaModule(module, {
            constrainGridType: false,
            positionType: "MID",
          }),
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
      layoutsDB.vanillaColumns.put({
        layoutsKey,
        vanillaColumn: {
          gridGroups,
          length: gridGroups[0].length,
        },
      })
    })
  )

  return layout
}

const processLayoutsQueue = async () => {
  if (modulesCache.length === 0) {
    return
  }

  // Process queue one item at a time
  while (layoutsQueue.length > 0) {
    const layoutsKey = layoutsQueue.shift()
    if (layoutsKey) {
      await processLayout(layoutsKey)
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

const postLayout = (key: LayoutsKey) => {
  layoutsQueue.push(key)
}

const postLayouts = (keys: LayoutsKey[]) => {
  keys.map(postLayout)
}

if (!isSSR()) {
  liveQuery(() => systemsDB.houseTypes.toArray()).subscribe((houseTypes) => {
    postLayouts(houseTypes)
    processLayoutsQueue()
  })
}

const api = {
  postLayout,
  postLayouts,
  processLayout,
}

export type LayoutsAPI = typeof api

expose(api)
