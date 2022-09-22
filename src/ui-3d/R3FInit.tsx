import FullScreenContainer from "@/ui/FullScreenContainer"
import { PropsWithChildren } from "react"
import MapboxCanvas from "./MapboxCanvas"

type Props = PropsWithChildren<{}>

const R3FInit = (props: Props) => {
  const { children } = props

  return (
    <FullScreenContainer>
      <MapboxCanvas>{children}</MapboxCanvas>
    </FullScreenContainer>
  )
}

export default R3FInit
