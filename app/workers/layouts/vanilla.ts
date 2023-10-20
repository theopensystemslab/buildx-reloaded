import { liveQuery } from "dexie"
import { flow, identity, pipe } from "fp-ts/lib/function"
import { Module } from "../../../server/data/modules"
import layoutsDB, {
  IndexedVanillaModule,
  PositionedColumn,
  PositionedRow,
} from "../../db/layouts"
import systemsDB, { LastFetchStamped } from "../../db/systems"
import {
  A,
  all,
  compareProps,
  O,
  Ord,
  S,
  someOrError,
  T,
  TO,
} from "../../utils/functions"
import { getModules } from "./modules"

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
  })
)

export const postVanillaColumn = async (arbitraryColumn: PositionedColumn) => {
  const modules = await getModules()

  pipe(
    arbitraryColumn.positionedRows,
    A.traverse(O.Applicative)(
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
      }): O.Option<PositionedRow> => {
        const getVanillaModule = createVanillaModuleGetter(modules)({
          constrainGridType: false,
          sectionType,
          levelType,
          positionType: "MID",
        })
        return pipe(
          module,
          getVanillaModule,
          O.map((vanillaModule) => ({
            positionedModules: [
              {
                module: vanillaModule,
                gridGroupIndex: 0,
                // TODO: document me (quirk)
                z: vanillaModule.length / 2,
              },
            ],
            length: vanillaModule.length,
            y,
            levelIndex,
            levelType,
          }))
        )
      }
    ),
    O.map((gridGroups) => {
      const levelTypes = pipe(
        gridGroups,
        A.map((gridGroup) => gridGroup.levelType)
      )

      pipe(
        gridGroups,
        A.head,
        O.chain((gridGroup) =>
          pipe(
            gridGroup.positionedModules,
            A.head,
            O.map((firstModule) => {
              const {
                module: {
                  systemId,
                  structuredDna: { sectionType },
                  length,
                },
              } = firstModule

              layoutsDB.vanillaColumns.put({
                systemId,
                levelTypes,
                sectionType,
                vanillaColumn: {
                  positionedRows: gridGroups,
                  length,
                },
              })
            })
          )
        )
      )
    })
  )
}
