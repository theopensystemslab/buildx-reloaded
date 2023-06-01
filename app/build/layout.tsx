import dynamic from "next/dynamic"
import { PropsWithChildren } from "react"
import Footer from "../ui/Footer"
import BuildNav from "./common/BuildNav"

const HousesPillsSelector = dynamic(
  () => import("../analyse/ui/HousesPillsSelector"),
  {
    ssr: false,
  }
)

const BuildLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="flex flex-col h-full pt-[5.5rem]">
      <div className="flex-1 flex-grow-0">
        <HousesPillsSelector />
      </div>
      <div className="flex flex-auto h-full">
        <div className="flex-1 flex-grow-0 flex-shrink-0 h-full">
          <BuildNav />
        </div>
        <div className="flex-auto border-l border-grey-20">{children}</div>
      </div>
      <Footer />
    </div>
  )
}

export default BuildLayout
