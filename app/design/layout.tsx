import { PropsWithChildren } from "react"
import LocateLayout from "../locate/layout"
import { TrpcProvider } from "../ui/TrpcProvider"

const DesignLayout = (props: PropsWithChildren<{}>) => {
  const { children } = props
  return (
    <TrpcProvider>
      <LocateLayout>{children}</LocateLayout>
    </TrpcProvider>
  )
}

export default DesignLayout
