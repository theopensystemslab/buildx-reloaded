import globals, { useGlobals } from "@/hooks/globals"
import mapboxStore, { useMapboxStore } from "@/hooks/mapboxStore"
import MapboxR3FCanvas from "@/ui-3d/init/MapboxR3FCanvas"
import MapboxR3FCanvasProjector from "@/ui-3d/init/MapboxR3FCanvasProjector"
import VanillaR3FCanvas from "@/ui-3d/init/VanillaR3FCanvas"
import Lighting from "@/ui-3d/init/Lighting"
import RectangularGrid from "@/ui-3d/init/RectangularGrid"
import EventDiv from "@/ui/EventDiv"
import HtmlUi from "@/ui/HtmlUi"
import dynamic from "next/dynamic"
import { Fragment, PropsWithChildren } from "react"
import { useKey } from "react-use"
import FullScreenContainer from "../../ui/FullScreenContainer"
import GroundPlane from "../GroundPlane"

const DataPreload = dynamic(() => import("@/data/DataPreload"), { ssr: false })

type Props = PropsWithChildren<{}>

const Shared = () => {
  const { preload } = useGlobals()

  return (
    <Fragment>
      <axesHelper />
      <Lighting />
      <RectangularGrid
        x={{ cells: 61, size: 1 }}
        z={{ cells: 61, size: 1 }}
        color="#ababab"
      />
      <GroundPlane
        onChange={(xz) => void (globals.pointerXZ = xz)}
        onNearClick={() => {
          // menu.open = false
          // scope.selected = null
          // clearIlluminatedMaterials()
        }}
        onNearHover={() => {
          // if (menu.open) return
          // scope.hovered = null
          // if (scope.selected === null) clearIlluminatedMaterials()
        }}
      />
      {preload && <DataPreload />}
    </Fragment>
  )
}

const AppInit = (props: Props) => {
  const { children } = props

  const { mapboxEnabled } = useMapboxStore()

  useKey("t", () => {
    mapboxStore.mapboxEnabled = !mapboxStore.mapboxEnabled
  })

  return (
    <FullScreenContainer className="overflow-hidden">
      <EventDiv>
        {!mapboxEnabled ? (
          <VanillaR3FCanvas>
            <Shared />
            {children}
          </VanillaR3FCanvas>
        ) : (
          <MapboxR3FCanvas>
            <MapboxR3FCanvasProjector>
              <Shared />
              {children}
            </MapboxR3FCanvasProjector>
          </MapboxR3FCanvas>
        )}
      </EventDiv>
      <HtmlUi />
    </FullScreenContainer>
  )
}

export default AppInit
