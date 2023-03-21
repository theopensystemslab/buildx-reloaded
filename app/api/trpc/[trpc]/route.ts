import { initTRPC } from "@trpc/server"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "../../../../server/router"

const t = initTRPC.create()

export type AppRouter = typeof appRouter

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => ({}),
  })
}

export const GET = handler
export const POST = handler
