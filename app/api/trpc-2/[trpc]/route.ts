import { initTRPC } from "@trpc/server"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
// import { elementsQuery } from "@/data/elements"
// import { allHouseTypesQuery, systemHouseTypesQuery } from "@/data/houseType"
// import { materialsQuery } from "@/data/materials"
import { modulesQuery } from "~/server/data/modules"
// import { sectionTypesQuery } from "@/data/sectionTypes"
import { systemIdParser } from "~/server/data/system"
import Airtable from "airtable"
// import { levelTypesQuery } from "@/data/levelTypes"
// import { windowTypesQuery } from "@/data/windowTypes"
// import { stairTypesQuery } from "@/data/stairTypes"

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY })
const airtable = new Airtable()

const t = initTRPC.create()

const appRouter = t.router({
  systemModules: t.procedure
    .input(systemIdParser)
    .query(modulesQuery(airtable)),
  // systemHouseTypes: t.procedure
  //   .input(systemIdParser)
  //   .query(systemHouseTypesQuery(airtable)),
  // allHouseTypes: t.procedure.query(allHouseTypesQuery(airtable)),
  // systemElements: t.procedure
  //   .input(systemIdParser)
  //   .query(elementsQuery(airtable)),
  // systemMaterials: t.procedure
  //   .input(systemIdParser)
  //   .query(materialsQuery(airtable)),
  // sectionTypes: t.procedure
  //   .input(systemIdParser)
  //   .query(sectionTypesQuery(airtable)),
  // levelTypes: t.procedure
  //   .input(systemIdParser)
  //   .query(levelTypesQuery(airtable)),
  // windowTypes: t.procedure
  //   .input(systemIdParser)
  //   .query(windowTypesQuery(airtable)),
  // stairTypes: t.procedure
  //   .input(systemIdParser)
  //   .query(stairTypesQuery(airtable)),
  foo: t.procedure.query(() => ({ foo: "foo" })),
})

export type AppRouter = typeof appRouter

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc-2",
    req: request,
    router: appRouter,
    createContext: () => ({}),
  })
}

export const GET = handler
export const POST = handler
