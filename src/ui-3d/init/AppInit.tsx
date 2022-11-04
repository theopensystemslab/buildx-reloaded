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
import { Fragment, PropsWithChildren, useEffect, useRef } from "react"
import { useKey } from "react-use"
import { Matrix4 } from "three"
import { subscribeKey } from "valtio/utils"
import dimensions from "../../hooks/dimensions"
import events from "../../hooks/events"
import houses from "../../hooks/houses"
import FullScreenContainer from "../../ui/FullScreenContainer"
import { addV3 } from "../../utils/math"
import GroundPlane from "../GroundPlane"

const DataPreload = dynamic(() => import("@/data/DataPreload"), { ssr: false })

type Props = PropsWithChildren<{}>

const Common = () => {
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

  const m4 = useRef(new Matrix4())

  useEffect(
    () =>
      subscribeKey(events.before, "newHouseTransform", () => {
        if (events.before.newHouseTransform === null) return
        const { houseId, positionDelta, rotation } =
          events.before.newHouseTransform

        // const [dx, dy, dz] = positionDelta

        // const thisObb = dimensions[houseId].obb

        // m4.current.makeRotationY(rotation)
        // m4.current.makeTranslation(dx, dy, dz)

        // thisObb.applyMatrix4(m4.current)

        // try new dimensions

        // let allowed = true

        // for (let [k, { obb }] of Object.entries(dimensions)) {
        //   if (k === houseId) continue
        //   const intersects = obb.intersectsOBB(thisObb)
        //   if (intersects) {
        //     allowed = false
        //     break
        //   }
        // }

        // // reset dimensions if not working
        // if (!allowed) {
        //   m4.current.invert()
        //   thisObb.applyMatrix4(m4.current)
        //   return
        // }

        if (positionDelta)
          houses[houseId].position = addV3(
            houses[houseId].position,
            positionDelta
          )
        if (rotation) houses[houseId].rotation = rotation

        events.after.newHouseTransform = events.before.newHouseTransform
      }),
    []
  )

  return (
    <FullScreenContainer className="overflow-hidden">
      <EventDiv>
        {!mapboxEnabled ? (
          <VanillaR3FCanvas>
            <Common />
            {children}
          </VanillaR3FCanvas>
        ) : (
          <MapboxR3FCanvas>
            <MapboxR3FCanvasProjector>
              <Common />
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
