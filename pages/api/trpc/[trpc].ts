import { allHouseTypesQuery, systemHouseTypesQuery } from "@/data/houseType"
import { initTRPC } from "@trpc/server"
import * as trpcNext from "@trpc/server/adapters/next"
import Airtable from "airtable"
import { materialsQuery } from "@/data/materials"
import { systemIdParser } from "@/data/system"
import { sectionTypesQuery } from "@/data/sectionTypes"
import { modulesQuery } from "@/data/modules"
import { elementsQuery } from "@/data/elements"

export const t = initTRPC()()

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY })
const airtable = new Airtable()

export const appRouter = t.router({
  systemModules: t.procedure
    .input(systemIdParser)
    .query(modulesQuery(airtable)),
  systemHouseTypes: t.procedure
    .input(systemIdParser)
    .query(systemHouseTypesQuery(airtable)),
  allHouseTypes: t.procedure.query(allHouseTypesQuery(airtable)),
  systemElements: t.procedure
    .input(systemIdParser)
    .query(elementsQuery(airtable)),
  systemMaterials: t.procedure
    .input(systemIdParser)
    .query(materialsQuery(airtable)),
  sectionTypes: t.procedure
    .input(systemIdParser)
    .query(sectionTypesQuery(airtable)),
})

// export type definition of API
export type AppRouter = typeof appRouter

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
})
