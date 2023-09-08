"use client"
import Effects from "~/design/ui-3d/init/Effects"
import GroundCircle from "~/design/ui-3d/init/GroundCircle"
import Lighting from "~/design/ui-3d/init/Lighting"
import MapboxR3FCanvas from "~/design/ui-3d/init/MapboxR3FCanvas"
import MapboxR3FCanvasProjector from "~/design/ui-3d/init/MapboxR3FCanvasProjector"
import RectangularGrid from "~/design/ui-3d/init/RectangularGrid"
import ShadowPlane from "~/design/ui-3d/init/ShadowPlane"
import VanillaR3FCanvas from "~/design/ui-3d/init/VanillaR3FCanvas"
import FullScreenContainer from "~/ui//FullScreenContainer"
import dynamic from "next/dynamic"
import { Fragment, PropsWithChildren } from "react"
import SiteCamControls from "../camera/SiteCamControls"
import HtmlUi from "../../ui/HtmlUi"
import { useDesignSettings } from "../../state/settings"

const SiteBoundary = dynamic(() => import("../SiteBoundary"), {
  ssr: false,
})

type Props = PropsWithChildren<{
  mapEnabled: boolean
  controlsEnabled: boolean
}>

const Common = (props: Props) => {
  const { children } = props
  const { groundPlaneEnabled: groundPlane } = useDesignSettings()

  return (
    <Fragment>
      <axesHelper />
      {groundPlane && (
        <>
          <GroundCircle />
          <ShadowPlane />
        </>
      )}
      <Lighting />
      <RectangularGrid
        x={{ cells: 61, size: 1 }}
        z={{ cells: 61, size: 1 }}
        color={0xffffff}
        opacity={1}
      />
      <SiteBoundary />
      <Effects />
      <SiteCamControls />
      {children}
    </Fragment>
  )
}

const AppInit = (props: Props) => {
  const { controlsEnabled, mapEnabled, children } = props

  return (
    <FullScreenContainer>
      {!mapEnabled ? (
        <VanillaR3FCanvas>
          <Common {...props}>{children}</Common>
        </VanillaR3FCanvas>
      ) : (
        <MapboxR3FCanvas>
          <MapboxR3FCanvasProjector>
            <Common {...props}>{children}</Common>
          </MapboxR3FCanvasProjector>
        </MapboxR3FCanvas>
      )}
      {controlsEnabled && <HtmlUi controlsEnabled={controlsEnabled} />}
    </FullScreenContainer>
  )
}

export default AppInit
