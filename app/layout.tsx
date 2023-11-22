import clsx from "clsx"
import { Inter } from "next/font/google"
import { PropsWithChildren } from "react"
import "~/styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

const Layout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <html lang="en" className={clsx(inter.className, "w-full h-full")}>
      <body className="w-full h-full ">{children}</body>
    </html>
  )
}

export default Layout
