import dynamic from "next/dynamic"
import { PropsWithChildren } from "react"
import Footer from "../ui/Footer"
import { TrpcProvider } from "../ui/TrpcProvider"
import BuildNav from "./common/BuildNav"

const HousesPillsSelector = dynamic(
  () => import("../analyse/ui/HousesPillsSelector"),
  {
    ssr: false,
  }
)

const BuildLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <TrpcProvider>
      <div className="flex-auto overflow-y-auto flex flex-col">
        <div className="flex-1 flex-grow-0">
          <HousesPillsSelector />
        </div>
        <div className="flex flex-auto h-full overflow-y-auto">
          <div className="flex-1 flex-grow-0 flex-shrink-0 h-full">
            <BuildNav />
          </div>
          <div className="flex-auto border-l border-grey-20">{children}</div>
        </div>
      </div>
      <Footer />
    </TrpcProvider>
  )
}

export default BuildLayout
