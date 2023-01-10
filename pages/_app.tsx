import { trpc } from "@/utils/trpc"
import { NextPage } from "next"
import { AppProps } from "next/app"
import type { AppType } from "next/dist/shared/lib/utils"
import { ReactElement, ReactNode } from "react"
import "~/styles/globals.css"

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const MyApp: any = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page)
  return getLayout(<Component {...pageProps} />)
}

export default trpc.withTRPC(MyApp)
