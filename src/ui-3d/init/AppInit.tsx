import { useGlobals } from "@/hooks/globals"
import { useMapboxStore } from "@/hooks/mapboxStore"
import Lighting from "@/ui-3d/init/Lighting"
import MapboxR3FCanvas from "@/ui-3d/init/MapboxR3FCanvas"
import MapboxR3FCanvasProjector from "@/ui-3d/init/MapboxR3FCanvasProjector"
import RectangularGrid from "@/ui-3d/init/RectangularGrid"
import VanillaR3FCanvas from "@/ui-3d/init/VanillaR3FCanvas"
import EventDiv from "@/ui/EventDiv"
import HtmlUi from "@/ui/HtmlUi"
import dynamic from "next/dynamic"
import { Fragment, PropsWithChildren } from "react"
import FullScreenContainer from "../../ui/FullScreenContainer"
import Effects from "./Effects"
import GroundCircle from "./GroundCircle"
import ShadowPlane from "./ShadowPlane"

const DataPreload = dynamic(() => import("@/data/DataPreload"), { ssr: false })

type Props = PropsWithChildren<{}>

const Common = (props: Props) => {
  const { children } = props
  const { preload, groundPlane } = useGlobals()

  return (
    <Fragment>
      {preload && <DataPreload />}
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
        color="#ababab"
      />
      <Effects />
      {children}
    </Fragment>
  )
}

const AppInit = (props: Props) => {
  const { children } = props

  const { mapboxEnabled } = useMapboxStore()

  // useKey("t", () => {
  //   mapboxStore.mapboxEnabled = !mapboxStore.mapboxEnabled
  // })

  // useHouseTransformCollisionDetection()

  return (
    <FullScreenContainer className="overflow-hidden">
      <EventDiv>
        {!mapboxEnabled ? (
          <VanillaR3FCanvas>
            <Common>{children}</Common>
          </VanillaR3FCanvas>
        ) : (
          <MapboxR3FCanvas>
            <MapboxR3FCanvasProjector>
              <Common>{children}</Common>
            </MapboxR3FCanvasProjector>
          </MapboxR3FCanvas>
        )}
      </EventDiv>
      <HtmlUi />
    </FullScreenContainer>
  )
}

export default AppInit
