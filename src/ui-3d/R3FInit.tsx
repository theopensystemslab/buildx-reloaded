import FullScreenContainer from "@/ui/FullScreenContainer"
import { OrbitControls } from "@react-three/drei"
import { PropsWithChildren } from "react"
import Lighting from "./Lighting"
import RectangularGrid from "./RectangularGrid"
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
