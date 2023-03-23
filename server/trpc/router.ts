import { elementsQuery } from "~/server/data/elements"
import {
  allHouseTypesQuery,
  systemHouseTypesQuery,
} from "~/server/data/houseType"
import { materialsQuery } from "~/server/data/materials"
import { modulesQuery } from "~/server/data/modules"
import { sectionTypesQuery } from "~/server/data/sectionTypes"
import { systemIdParser } from "~/server/data/system"
import Airtable from "airtable"
import { levelTypesQuery } from "~/server/data/levelTypes"
import { windowTypesQuery } from "~/server/data/windowTypes"
import { stairTypesQuery } from "~/server/data/stairTypes"
import { initTRPC } from "@trpc/server"
import { blocksQuery } from "../data/blocks"
import { blockModulesQuery } from "../data/blockModules"

const t = initTRPC.create()

const { router, procedure } = t

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY })
const airtable = new Airtable()

export const appRouter = router({
  systemModules: procedure.input(systemIdParser).query(modulesQuery(airtable)),
  systemHouseTypes: procedure
    .input(systemIdParser)
    .query(systemHouseTypesQuery(airtable)),
  allHouseTypes: procedure.query(allHouseTypesQuery(airtable)),
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
  systemBlocks: procedure.input(systemIdParser).query(blocksQuery(airtable)),
  systemBlockModules: procedure
    .input(systemIdParser)
    .query(blockModulesQuery(airtable)),
})

// export type definition of API
export type AppRouter = typeof appRouter
