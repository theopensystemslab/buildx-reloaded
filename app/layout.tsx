"use client"

import "@/styles/globals.css"
import { PropsWithChildren } from "react"
import { Analyse, Build, Design, Locate } from "@/ui/icons"
import NavIconButton from "@/ui/common/NavIconButton"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

const Layout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className="fixed flex h-full w-full flex-col overflow-auto">
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
          <div className="flex-auto h-full">{children}</div>
        </div>
      </body>
    </html>
  )
}

export default Layout
