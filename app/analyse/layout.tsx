import dynamic from "next/dynamic"
import { PropsWithChildren } from "react"

// const HousesPillsSelector = dynamic(() => import("./ui/HousesPillsSelector"), {
//   ssr: false,
// })

const AnalyseLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex-grow-0">{/* <HousesPillsSelector /> */}</div>
      <div className="flex-auto">{children}</div>
    </div>
  )
}

export default AnalyseLayout
