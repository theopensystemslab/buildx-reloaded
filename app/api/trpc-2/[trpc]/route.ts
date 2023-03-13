import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "../../../../server/routers/_app"

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
