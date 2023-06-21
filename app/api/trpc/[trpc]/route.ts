import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/server/trpc/router"

export type AppRouter = typeof appRouter

const handler = async (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => ({}),
  })
}

export const GET = handler
export const POST = handler
