import FullScreenContainer from "@/ui/FullScreenContainer"
import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { PropsWithChildren } from "react"
import { Vector3 } from "three"
import Lighting from "../ui-3d/Lighting"
import RectangularGrid from "../ui-3d/RectangularGrid"

type Props = PropsWithChildren<{}>

const SiteThreeInit = (props: Props) => {
  const { children } = props

  return (
    <FullScreenContainer>
      <Canvas camera={{ position: [10, 10, 10] }}>
        <axesHelper />
        <Lighting />
        <RectangularGrid
          x={{ cells: 61, size: 1 }}
          z={{ cells: 61, size: 1 }}
          color="#ababab"
        />
        {children}
        <OrbitControls />
      </Canvas>
    </FullScreenContainer>
  )
}

export default SiteThreeInit
