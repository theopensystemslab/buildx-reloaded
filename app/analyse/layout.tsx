import dynamic from "next/dynamic"
import { PropsWithChildren } from "react"
import Footer from "../ui/Footer"
import { TrpcProvider } from "../ui/TrpcProvider"

const HousesPillsSelector = dynamic(() => import("./ui/HousesPillsSelector"), {
  ssr: false,
})

const AnalyseLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <TrpcProvider>
      <div className="flex flex-col h-full">
        <div className="flex-1 flex-grow-0">
          <HousesPillsSelector />
        </div>
        <div className="flex-auto">
          {/* <div className="flex-1 flex-grow-0 flex-shrink-0">
          <AnalyseNav />
        </div> */}
          {children}
        </div>
        <Footer />
      </div>
    </TrpcProvider>
  )
}

export default AnalyseLayout
