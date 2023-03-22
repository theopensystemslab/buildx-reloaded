import { initTRPC } from "@trpc/server"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { NextApiResponse } from "next"
import { appRouter } from "../../../../server/trpc/router"

const t = initTRPC.create()

export type AppRouter = typeof appRouter

const handler = async (request: Request, response: NextApiResponse) => {
  response.setHeader("Access-Control-Allow-Origin", "*")
  response.setHeader("Access-Control-Request-Method", "*")
  response.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET")
  response.setHeader("Access-Control-Allow-Headers", "*")

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => ({}),
  })
}

export const GET = handler
export const POST = handler
