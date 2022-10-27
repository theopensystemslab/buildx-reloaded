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

const HtmlUi = () => {
  const { sidebar, shadows, orthographic } = useGlobals()
  const { mapboxEnabled } = useMapboxStore()
  const [universalMenu, setUniversalMenu] = useState(false)
  const cameraReset = useCameraReset()
  return (
    <Fragment>
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
