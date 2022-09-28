import { useGlobals } from "@/hooks/globals"
import mapboxStore, { useMapboxStore } from "@/hooks/mapboxStore"
import MapboxR3FCanvas from "@/ui-3d/canvas/MapboxR3FCanvas"
import MapboxR3FCanvasProjector from "@/ui-3d/canvas/MapboxR3FCanvasProjector"
import VanillaR3FCanvas from "@/ui-3d/canvas/VanillaR3FCanvas"
import Lighting from "@/ui-3d/Lighting"
import RectangularGrid from "@/ui-3d/RectangularGrid"
import EventDiv from "@/ui/EventDiv"
import HtmlUi from "@/ui/HtmlUi"
import dynamic from "next/dynamic"
import { Fragment, PropsWithChildren } from "react"
import { useKey } from "react-use"

const DataPreload = dynamic(() => import("@/data/DataPreload"), { ssr: false })

type Props = PropsWithChildren<{}>

const _SharedInit = () => {
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
    <EventDiv>
      {!mapboxEnabled ? (
        <VanillaR3FCanvas>
          <_SharedInit />
          {children}
        </VanillaR3FCanvas>
      ) : (
        <MapboxR3FCanvas>
          <MapboxR3FCanvasProjector>
            <_SharedInit />
            {children}
          </MapboxR3FCanvasProjector>
        </MapboxR3FCanvas>
      )}
      <HtmlUi />
    </EventDiv>
  )
}

export default AppInit
