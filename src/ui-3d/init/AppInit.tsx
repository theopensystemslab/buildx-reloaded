import globals, { useGlobals } from "@/hooks/globals"
import mapboxStore, { useMapboxStore } from "@/hooks/mapboxStore"
import Lighting from "@/ui-3d/init/Lighting"
import MapboxR3FCanvas from "@/ui-3d/init/MapboxR3FCanvas"
import MapboxR3FCanvasProjector from "@/ui-3d/init/MapboxR3FCanvasProjector"
import RectangularGrid from "@/ui-3d/init/RectangularGrid"
import VanillaR3FCanvas from "@/ui-3d/init/VanillaR3FCanvas"
import EventDiv from "@/ui/EventDiv"
import HtmlUi from "@/ui/HtmlUi"
import dynamic from "next/dynamic"
import { Fragment, PropsWithChildren, useEffect } from "react"
import { useKey } from "react-use"
import { subscribeKey } from "valtio/utils"
import dimensions from "../../hooks/dimensions"
import events from "../../hooks/events"
import houses from "../../hooks/houses"
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

  useEffect(
    () =>
      subscribeKey(events.before, "newHouseTransform", () => {
        if (events.before.newHouseTransform === null) return
        const { houseId, position, rotation } = events.before.newHouseTransform

        const thisDimensions = dimensions[houseId]

        // try new dimensions

        let allowed = true

        for (let [k, v] of Object.entries(dimensions)) {
          if (k === houseId) continue
          const intersects = v.intersectsBox(thisDimensions)
          if (intersects) {
            allowed = false
            break
          }
        }

        // reset dimensions if not working
        if (!allowed) return

        if (position) houses[houseId].position = position
        if (rotation) houses[houseId].rotation = rotation
      }),
    []
  )

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
