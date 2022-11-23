import React, { Fragment, useState } from "react"
import IconButton from "./IconButton"
import SiteSidebar from "./SiteSidebar"
import { Add, ChoroplethMap, Reset, View } from "@carbon/icons-react"
import {
  setOrthographic,
  setShadows,
  setSidebar,
  useGlobals,
} from "../hooks/globals"
import UniversalMenu from "./UniversalMenu"
import { Menu, SectionCuts } from "./icons"
import IconMenu from "./IconMenu"
// import Checklist from "./Checklist"
import Radio from "./Radio"
import { useCameraReset } from "../hooks/camera"
import { setMapboxEnabled, useMapboxStore } from "../hooks/mapboxStore"
import { useSnapshot } from "valtio"
import elementCategories from "../hooks/elementCategories"
import { pipe } from "fp-ts/lib/function"
import Checklist from "./Checklist"
import { R, RR, S } from "../utils/functions"
import { useHouses, useInsert1000Skylarks } from "../hooks/houses"
import { useTransients } from "../hooks/transients"
import { useHandleDragEvents } from "../hooks/drag/handles"

const HtmlUi = () => {
  const { sidebar, shadows, orthographic } = useGlobals()
  const { mapboxEnabled } = useMapboxStore()
  const [universalMenu, setUniversalMenu] = useState(false)
  const cameraReset = useCameraReset()

  const categories = useSnapshot(elementCategories) as typeof elementCategories

  useInsert1000Skylarks()

  const transients = useTransients()
  const houses = useHouses()

  // const elementDragEvents = useElementDragEvents()
  // const handleDragEvents = useHandleDragEvents()

  return (
    <Fragment>
      <div className="absolute bottom-0 right-0">
        {/* <pre>{JSON.stringify(houses, null, 2)}</pre>
        <pre>{JSON.stringify(transients, null, 2)}</pre> */}
      </div>
      <div className="absolute top-0 right-0 z-10 flex items-center justify-center">
        <IconButton onClick={() => setSidebar(true)}>
          <div className="flex items-center justify-center">
            <Add size={32} />
          </div>
        </IconButton>
        <IconButton onClick={() => setUniversalMenu(true)}>
          <Menu />
        </IconButton>
      </div>
      <div className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 transform flex-col justify-center bg-white shadow">
        <IconMenu icon={() => <ChoroplethMap size={24} className="m-auto" />}>
          <Radio
            id="map"
            label="Map"
            options={[
              {
                label: "Disabled",
                value: false,
              },
              {
                label: "Enabled",
                value: true,
              },
            ]}
            selected={mapboxEnabled}
            onChange={setMapboxEnabled}
          />
        </IconMenu>
        <IconMenu icon={() => <View size={24} className="m-auto" />}>
          <Radio
            id="camera"
            label="Camera"
            options={[
              {
                label: "Perspective",
                value: false,
              },
              {
                label: "Orthographic",
                value: true,
              },
            ]}
            selected={orthographic}
            onChange={setOrthographic}
          />
          <IconButton onClick={cameraReset}>
            <Reset size={24} className="m-auto" />
          </IconButton>
        </IconMenu>
        <IconMenu icon={SectionCuts}>
          <Checklist
            label="Layers"
            options={pipe(
              categories,
              R.collect(S.Ord)((label, value) => ({ label, value: label }))
            )}
            selected={pipe(
              categories,
              R.filter((x) => x),
              R.collect(S.Ord)((value) => value)
            )}
            onChange={(selectedCategories) =>
              pipe(
                elementCategories,
                R.collect(S.Ord)((k, b) => {
                  if (selectedCategories.includes(k)) {
                    if (!elementCategories[k]) elementCategories[k] = true
                  } else {
                    if (elementCategories[k]) elementCategories[k] = false
                  }
                })
              )
            }
          />
          {/* <Checklist
            label="Vertical cuts"
            options={[
              { value: "width", label: "Width" },
              { value: "length", label: "Length" },
            ]}
            selected={pipe(
              verticalCuts,
              filterR((x) => x),
              keys
            )}
            onChange={setVerticalCuts}
          /> */}
          <Radio
            id="ground-plane"
            label="Ground Plane"
            options={[
              { value: false, label: "None" },
              { value: true, label: "Regular" },
            ]}
            selected={shadows}
            onChange={(newValue) => {
              setShadows(newValue)
            }}
          />
        </IconMenu>
      </div>
      <SiteSidebar open={sidebar} close={() => void setSidebar(false)} />
      <UniversalMenu
        open={universalMenu}
        close={() => setUniversalMenu(false)}
      />
    </Fragment>
  )
}

export default HtmlUi
