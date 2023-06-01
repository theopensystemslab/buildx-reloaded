import dynamic from "next/dynamic"
import { PropsWithChildren } from "react"
import Footer from "../ui/Footer"

const HousesPillsSelector = dynamic(() => import("./ui/HousesPillsSelector"), {
  ssr: false,
})

const AnalyseLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="flex flex-col h-full pt-[5.5rem]">
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
  )
}

export default AnalyseLayout
