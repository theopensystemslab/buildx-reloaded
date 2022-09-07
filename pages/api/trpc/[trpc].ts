import { houseTypesInputParser, houseTypesQuery } from "@/data/houseType"
import { modulesInputParser, modulesQuery } from "@/data/module"
import { initTRPC } from "@trpc/server"
import * as trpcNext from "@trpc/server/adapters/next"
import Airtable from "airtable"

export const t = initTRPC()()

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY })
const airtable = new Airtable()

export const appRouter = t.router({
  modules: t.procedure.input(modulesInputParser).query(modulesQuery(airtable)),
  houseTypes: t.procedure
    .input(houseTypesInputParser)
    .query(houseTypesQuery(airtable)),
})

// export type definition of API
export type AppRouter = typeof appRouter

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
})
