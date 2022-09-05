import FullScreenContainer from "@/ui/FullScreenContainer"
import { OrbitControls } from "@react-three/drei"
import { PropsWithChildren } from "react"
import Lighting from "../ui-3d/Lighting"
import RectangularGrid from "../ui-3d/RectangularGrid"
import ToggleCanvas from "./ToggleCanvas"

type Props = PropsWithChildren<{}>

const SiteThreeInit = (props: Props) => {
  const { children } = props

  return (
    <FullScreenContainer>
      <ToggleCanvas camera={{ position: [10, 10, 10] }}>
        {/* <OrbitControls /> */}
        {children}
      </ToggleCanvas>
    </FullScreenContainer>
  )
}

export default SiteThreeInit
