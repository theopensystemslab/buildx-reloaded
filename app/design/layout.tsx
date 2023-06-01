import { PropsWithChildren } from "react"
import LocateLayout from "../locate/layout"
import { TrpcProvider } from "../ui/TrpcProvider"
import { PreloadSpeckleObjects } from "../utils/speckle/useSpeckleObject"

const DesignLayout = (props: PropsWithChildren<{}>) => {
  const { children } = props
  return (
    <TrpcProvider>
      <LocateLayout>{children}</LocateLayout>
      <PreloadSpeckleObjects />
    </TrpcProvider>
  )
}

export default DesignLayout
