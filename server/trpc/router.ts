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
import { blockModulesEntriesQuery } from "../data/blockModulesEntries"
import { blocksQuery } from "../data/blocks"

const t = initTRPC.create()

const { router, procedure } = t

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY })
const airtable = new Airtable()

export const appRouter = router({
  modules: procedure.input(systemIdsParser).query(modulesQuery(airtable)),
  blocks: procedure.input(systemIdsParser).query(blocksQuery(airtable)),
  blockModulesEntries: procedure
    .input(systemIdsParser)
    .query(blockModulesEntriesQuery(airtable)),
  houseTypes: procedure.input(systemIdsParser).query(houseTypesQuery(airtable)),
  materials: procedure.input(systemIdsParser).query(materialsQuery(airtable)),
  elements: procedure.input(systemIdsParser).query(elementsQuery(airtable)),
  sectionTypes: procedure
    .input(systemIdsParser)
    .query(sectionTypesQuery(airtable)),
  levelTypes: procedure.input(systemIdsParser).query(levelTypesQuery(airtable)),
  windowTypes: procedure
    .input(systemIdsParser)
    .query(windowTypesQuery(airtable)),
  stairTypes: procedure.input(systemIdsParser).query(stairTypesQuery(airtable)),
})

// export type definition of API
export type AppRouter = typeof appRouter
