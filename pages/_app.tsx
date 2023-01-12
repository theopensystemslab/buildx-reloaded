import "@/styles/globals.css"
import { trpc } from "@/utils/trpc"
import { NextPage } from "next"
import { AppProps } from "next/app"
import { ReactElement, ReactNode } from "react"

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
