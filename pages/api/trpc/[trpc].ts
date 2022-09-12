import { allHouseTypesQuery, systemHouseTypesQuery } from "@/data/houseType"
import { modulesQuery } from "@/data/module"
import { initTRPC } from "@trpc/server"
import * as trpcNext from "@trpc/server/adapters/next"
import Airtable from "airtable"
import { systemIdParser } from "../../../src/data/system"

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
})

// export type definition of API
export type AppRouter = typeof appRouter

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
})
