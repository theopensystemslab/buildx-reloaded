import { initTRPC } from "@trpc/server"
import Airtable from "airtable"
import { elementsQuery } from "~/server/data/elements"
import { houseTypesQuery } from "~/server/data/houseType"
import { levelTypesQuery } from "~/server/data/levelTypes"
import { materialsQuery } from "~/server/data/materials"
import { modulesQuery } from "~/server/data/modules"
import { sectionTypesQuery } from "~/server/data/sectionTypes"
import { stairTypesQuery } from "~/server/data/stairTypes"
import { systemIdParser, systemIdsParser } from "~/server/data/system"
import { windowTypesQuery } from "~/server/data/windowTypes"
import { blockModulesEntryQuery } from "../data/blockModulesEntries"
import { blocksQuery } from "../data/blocks"

const t = initTRPC.create()

const { router, procedure } = t

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY })
const airtable = new Airtable()

export const appRouter = router({
  modules: procedure.input(systemIdsParser).query(modulesQuery(airtable)),
  blocks: procedure.input(systemIdsParser).query(blocksQuery(airtable)),
  blockModulesEntry: procedure
    .input(systemIdsParser)
    .query(blockModulesEntryQuery(airtable)),
  houseTypes: procedure.input(systemIdsParser).query(houseTypesQuery(airtable)),
  // -------------------------------------- old-new-sep
  systemElements: procedure
    .input(systemIdParser)
    .query(elementsQuery(airtable)),
  systemMaterials: procedure
    .input(systemIdParser)
    .query(materialsQuery(airtable)),
  systemSectionTypes: procedure
    .input(systemIdParser)
    .query(sectionTypesQuery(airtable)),
  systemLevelTypes: procedure
    .input(systemIdParser)
    .query(levelTypesQuery(airtable)),
  systemWindowTypes: procedure
    .input(systemIdParser)
    .query(windowTypesQuery(airtable)),
  systemStairTypes: procedure
    .input(systemIdParser)
    .query(stairTypesQuery(airtable)),
})

// export type definition of API
export type AppRouter = typeof appRouter
