import { liveQuery } from "dexie"
import { flow, identity, pipe } from "fp-ts/lib/function"
import { Module } from "../../../server/data/modules"
import layoutsDB from "../../db/layouts"
import systemsDB, { LastFetchStamped } from "../../db/systems"
import { A, all, O, Ord, S } from "../../utils/functions"

export const createVanillaModuleGetter =
  (modulesCache: LastFetchStamped<Module>[]) =>
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
      modulesCache,
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
  async (modules: LastFetchStamped<Module>[]) => {
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
              id,
              structuredDna: { sectionType, positionType, levelType, gridType },
              dna,
            }: LastFetchStamped<Module>) => {
              return await layoutsDB.vanillaModules.put({
                systemId,
                sectionType,
                positionType,
                levelType,
                gridType,
                moduleDna: dna,
              })
            }
          )
        )
      )
    )
  }
)

// ideas
// -----
// get each level type and iter that?
// vanilla modules by level type (with grid type 1)?
// -----
// positionType: MID
// gridType: {{ the lowest }}
// systemId: { for each }
// levelType: { this is what we group by }
// -----
// so Record<systemId, Record<levelTypeCode, VanillaModule>>
// -----
// then a getter function to get the vanilla module of some height

// liveQuery(() => layoutsDB.vanillaModules.toArray()).subscribe(
//   (dbVanillaModules) => {
//     for (const systemId of allSystemIds) {
//       pipe(dbVanillaModules, A.reduce({}, (acc,{systemId, levelType}) => {

//         return acc
//       }))
//     }
//   }
// )
