"use client"
import { createTRPCReact } from "@trpc/react-query"
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@/server/trpc/router"
import { getBaseUrl } from "../app/utils/next"

export const trpc = createTRPCReact<AppRouter>()

export const vanillaTrpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
    // httpBatchLink({
    //   url: "http://localhost:3000/trpc",
    //   // // You can pass any HTTP headers you wish here
    //   // async headers() {
    //   //   return {
    //   //     authorization: getAuthCookie(),
    //   //   };
    //   // },
    // }),
  ],
})
