import dynamic from "next/dynamic"
import { TrpcProvider } from "../common/TrpcProvider"
import BuildNav from "./common/BuildNav"

const HousesPillsSelector = dynamic(
  () => import("../common/HousesPillsSelector"),
  { ssr: false }
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex-grow-0">
        <HousesPillsSelector />
      </div>
      <div className="flex flex-auto">
        <div className="flex-1 flex-grow-0 flex-shrink-0 h-full">
          <BuildNav />
        </div>
        <div className="flex-auto">
          <TrpcProvider>{children}</TrpcProvider>
        </div>
      </div>
    </div>
  )
}
