import FullScreenContainer from "@/ui/FullScreenContainer"
import { PropsWithChildren } from "react"
import MapboxCanvas from "./MapboxCanvas"

type Props = PropsWithChildren<{}>

const R3FInit = (props: Props) => {
  const { children } = props

  return (
    <FullScreenContainer>
      <MapboxCanvas camera={{ position: [10, 10, 10] }}>
        {children}
      </MapboxCanvas>
    </FullScreenContainer>
  )
}

export default R3FInit
