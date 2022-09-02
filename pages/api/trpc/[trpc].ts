import { systemFromId } from "@/data/system"
import { initTRPC } from "@trpc/server"
import * as trpcNext from "@trpc/server/adapters/next"
import Airtable from "airtable"
import { z } from "zod"

export const t = initTRPC()()

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY })
const airtable = new Airtable()

export const appRouter = t.router({
  hello: t.procedure
    .input(
      z
        .object({
          text: z.string().nullish(),
        })
        .nullish()
    )
    .query(({ input }) => {
      return {
        greeting: `hello ${input?.text ?? "world"}`,
      }
    }),
  modules: t.procedure
    .input(
      z.object({
        buildSystemId: z.string().min(1),
      })
    )
    .query(({ input: { buildSystemId } }) =>
      airtable
        .base(systemFromId(buildSystemId)?.airtableId ?? "")
        .table("modules")
        .select()
        .all()
    ),
})

// export type definition of API
export type AppRouter = typeof appRouter

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
})
