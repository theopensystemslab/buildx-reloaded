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

export const getIndexedVanillaModule = ({
  systemId,
  sectionType,
  positionType,
  levelType,
  gridType,
}: {
  systemId: string
  sectionType: string
  positionType: string
  levelType: string
  gridType: string
}) =>
  layoutsDB.vanillaModules.get([
    systemId,
    sectionType,
    positionType,
    levelType,
    gridType,
  ])

liveQuery(() => layoutsDB.layouts.toArray()).subscribe((dbLayouts) => {
  for (let dbLayout of dbLayouts) {
    const { layoutsKey } = dbLayout
  }
})

// this actually needs to SUBSCRIBE TO HOUSES
// get their `dnas`
// get their column layout (maybe we're subscribing to layouts actually)
// layoutKey -> vanillaColumn we post
//
// ---------------------------------------------------------------------
//
// liveQuery(() => layoutsDB.vanillaModules.toArray()).subscribe(
//   async (dbVanillaMods) => {
//     if (dbVanillaMods.length > 0) {
//       const {
//         systemId,
//         sectionType,
//         positionType,
//         levelType,
//         gridType,
//         moduleDna,
//       } = dbVanillaMods[0]

//       console.log(
//         [systemId, sectionType, positionType, levelType, gridType].toString()
//       )
//     }

//   }
// )
