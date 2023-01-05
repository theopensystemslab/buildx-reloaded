import { setupTRPC } from "@trpc/next"
import type { AppRouter } from "~/pages/api/trpc/[trpc]"

function getBaseUrl() {
  if (typeof window !== "undefined")
    // browser should use relative path
    return ""

  if (process.env.VERCEL_URL)
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`

  if (process.env.RENDER_INTERNAL_HOSTNAME)
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`

  if (process.env.SITE_NAME) {
    const foo = `https://${process.env.SITE_NAME}.netlify.app`
    console.log(foo)
    return foo
  }

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export const trpc = setupTRPC<AppRouter>({
  config({ ctx }) {
    return {
      /**
       * If you want to use SSR, you need to use the server's full URL
       * @link https://trpc.io/docs/ssr
       **/
      url: `${getBaseUrl()}/api/trpc`,
      /**
       * @link https://react-query-v3.tanstack.com/reference/QueryClient
       **/
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 60,
            cacheTime: typeof window === "undefined" ? -1 : 5 * 60 * 1000,
          },
        },
      },
    }
  },
  /**
   * @link https://trpc.io/docs/ssr
   **/
  ssr: true,
})
// => { useQuery: ..., useMutation: ...}
