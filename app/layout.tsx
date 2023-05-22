"use client"

import { Inter } from "next/font/google"
import { PropsWithChildren } from "react"
import "~/styles/globals.css"
import NavIconButton from "~/ui//NavIconButton"
import { Analyse, Build, Design, Locate } from "~/ui/icons"
import { TrpcProvider } from "./ui/TrpcProvider"
import { PreloadSpeckleObjects } from "./utils/speckle/useSpeckleObject"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

const Layout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <TrpcProvider>
      <html lang="en" className={inter.className}>
        <body>
          <div className="fixed flex h-full w-full flex-col">
            <div className="flex flex-1 flex-grow-0 top-0 z-10 justify-between bg-white shadow items-center">
              <div id="headerStart" className="flex-1" />
              <div className="flex flex-none">
                <NavIconButton
                  href="/locate"
                  icon={<Locate />}
                  order={1}
                  label="Locate"
                />
                <NavIconButton
                  href="/design"
                  icon={<Design />}
                  order={2}
                  label="Design"
                />
                <NavIconButton
                  href="/analyse"
                  icon={<Analyse />}
                  order={3}
                  label="Analyse"
                  unpaddedSvg
                />
                <NavIconButton
                  href="/build"
                  icon={<Build />}
                  order={4}
                  label="Build"
                  unpaddedSvg
                />
              </div>
              <div id="headerEnd" className="flex-1" />
            </div>
            <div className="flex-auto h-full overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </div>
        </body>
      </html>
      <PreloadSpeckleObjects />
    </TrpcProvider>
  )
}

export default Layout
