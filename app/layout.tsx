import { Inter } from "next/font/google"
import { PropsWithChildren } from "react"
import "~/styles/globals.css"
import Nav from "./ui/Nav"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

const Layout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <html lang="en" className={inter.className}>
      <body className="h-screen flex flex-col">
        <Nav />
        <div className="flex-auto overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}

export default Layout
