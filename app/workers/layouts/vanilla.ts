import { liveQuery } from "dexie"
import { flow, identity, pipe } from "fp-ts/lib/function"
import { Module } from "../../../server/data/modules"
import layoutsDB, {
  IndexedVanillaModule,
  PositionedColumn,
  createRow,
  positionRows,
} from "../../db/layouts"
import systemsDB, { LastFetchStamped } from "../../db/systems"
import { A, O, Ord, S, T, all, someOrError } from "../../utils/functions"
import { getModules } from "./modules"
import { retryTask } from "../../utils/async"

export const createVanillaModuleGetter =
  (modules: LastFetchStamped<Module>[]) =>
  (
    opts: {
      positionType?: string
      levelType?: string
      constrainGridType?: boolean
      sectionType?: string
    } = {}
  ) =>
  (module: Module): O.Option<LastFetchStamped<Module>> => {
    const {
      sectionType,
      positionType,
      levelType,
      constrainGridType = true,
    } = opts

    return pipe(
      modules,
      A.filter((sysModule) =>
        all(
          sysModule.systemId === module.systemId,
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

liveQuery(() => systemsDB.modules.toArray()).subscribe(
  (modules: LastFetchStamped<Module>[]) => {
    const getVanillaModule = createVanillaModuleGetter(modules)()

    pipe(
      modules,
      A.map(getVanillaModule),
      A.traverse(O.Applicative)(identity),
      O.map(
        flow(
          A.uniq({ equals: (x, y) => x.dna === y.dna }),
          A.map(
            async ({
              systemId,
              structuredDna: { sectionType, positionType, levelType, gridType },
              dna,
            }: LastFetchStamped<Module>) =>
              layoutsDB.vanillaModules.put({
                systemId,
                sectionType,
                positionType,
                levelType,
                gridType,
                moduleDna: dna,
              })
          )
        )
      )
    )
  }
)

export const getIndexedVanillaModule =
  ({
    systemId,
    sectionType,
    positionType,
    levelType,
    gridType,
  }: Omit<IndexedVanillaModule, "moduleDna">): T.Task<
    IndexedVanillaModule | undefined
  > =>
  () =>
    layoutsDB.vanillaModules.get([
      systemId,
      sectionType,
      positionType,
      levelType,
      gridType,
    ])

export const getVanillaModule = flow(
  getIndexedVanillaModule,
  T.chain((indexedVanillaModule) => {
    if (!indexedVanillaModule) {
      throw new Error(`no vanilla`)
    }

    return pipe(
      () => getModules(),
      T.map((allModules) =>
        pipe(
          allModules,
          A.findFirst(
            ({ systemId, dna }) =>
              systemId === indexedVanillaModule.systemId &&
              indexedVanillaModule.moduleDna === dna
          ),
          someOrError(`no vanilla`)
        )
      )
    )
  }),
  retryTask
)

export const postVanillaColumn = (arbitraryColumn: PositionedColumn) =>
  pipe(
    arbitraryColumn.positionedRows,
    A.traverse(T.ApplicativeSeq)(
      ({
        levelIndex,
        levelType,
        y,
        positionedModules: [
          {
            module,
            module: {
              structuredDna: { sectionType },
            },
          },
        ],
      }) => {
        const {
          systemId,
          structuredDna: { gridType, positionType },
        } = module

        return pipe(
          () => getModules(),
          T.chain((modules) => {
            const getVanillaModule = createVanillaModuleGetter(modules)({
              constrainGridType: false,
              sectionType,
              levelType,
              positionType: "MID",
            })

            return pipe(
              getVanillaModule(module),
              O.map((vanillaModule) => createRow([vanillaModule])),
              someOrError(`no vanilla module for ${module.dna}`)
              // T.map((vanillaModule) => createRow([vanillaModule]))
            )
          })
        )

        // return pipe(
        //   getVanillaModule({
        //     systemId,
        //     sectionType,
        //     positionType,
        //     levelType,
        //     gridType,
        //   }),
        //   T.chain((vanillaModule) => createRow([vanillaModule]))
        // )
      }
    ),
    retryTask,
    T.map(positionRows),
    T.map((positionedRows) => {
      const columnLength = positionedRows.reduce(
        (acc, { positionedModules }) =>
          acc + positionedModules.reduce((bcc, w) => bcc + w.module.length, 0),
        0
      )
      const {
        systemId,
        structuredDna: { sectionType },
      } = positionedRows[0].positionedModules[0].module

      const levelTypes = pipe(
        positionedRows,
        A.map((row) => row.levelType)
      )

      return layoutsDB.vanillaColumns.put({
        systemId,
        levelTypes,
        sectionType,
        vanillaColumn: {
          positionedRows,
          columnLength,
        },
      })
    })
  )
