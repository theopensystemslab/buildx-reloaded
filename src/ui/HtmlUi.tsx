import { Add, Reset, View, WatsonHealthSubVolume } from "@carbon/icons-react"
import { Fragment, useState } from "react"
import {
  setOrthographic,
  setGroundPlane,
  setSidebar,
  useGlobals,
  useVerticalCuts,
} from "../hooks/globals"
import IconButton from "./IconButton"
import IconMenu from "./IconMenu"
import { Menu, SectionCuts } from "./icons"
import SiteSidebar from "./SiteSidebar"
import UniversalMenu from "./UniversalMenu"
// import Checklist from "./Checklist"
import { pipe } from "fp-ts/lib/function"
import { keys } from "fp-ts/lib/Record"
import usePortal from "react-cool-portal"
import { useSnapshot } from "valtio"
import { useCameraReset } from "../hooks/camera"
import elementCategories from "../hooks/elementCategories"
import { useMapboxStore } from "../hooks/mapboxStore"
import { useMenu } from "../hooks/menu"
import { R, S } from "../utils/functions"
import Breadcrumbs from "./Breadcrumbs"
import Checklist from "./Checklist"
import ExitMode from "./ExitMode"
import ContextMenuEntry from "./menu/ContextMenuEntry"
import Radio from "./Radio"

const HtmlUi = () => {
  const { sidebar, groundPlane, orthographic } = useGlobals()

  // const { mapboxEnabled } = useMapboxStore()

  const [universalMenu, setUniversalMenu] = useState(false)
  const cameraReset = useCameraReset()

  const categories = useSnapshot(elementCategories) as typeof elementCategories

  const [verticalCuts, setVerticalCuts] = useVerticalCuts()
  // useInsert1000Skylarks()

  const menu = useMenu()

  const { Portal: HeaderEndPortal } = usePortal({
    containerId: "headerEnd",
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  const { Portal: HeaderStartPortal } = usePortal({
    containerId: "headerStart",
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  return (
    <Fragment>
      <div className="absolute bottom-0 right-0 pointer-events-none">
        {/* <pre>{JSON.stringify(preTs, null, 2)}</pre>
        <pre>{JSON.stringify(postTs, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(ctx, null, 2)}</pre> */}
      </div>
      <HeaderEndPortal>
        <div className="flex items-center justify-end">
          <IconButton onClick={() => setSidebar(true)}>
            <div className="flex items-center justify-center">
              <Add size={32} />
            </div>
          </IconButton>
          <IconButton onClick={() => setUniversalMenu(true)}>
            <Menu />
          </IconButton>
        </div>
      </HeaderEndPortal>
      <div className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 transform flex-col justify-center bg-white shadow">
        {/* <IconMenu icon={() => <ChoroplethMap size={24} className="m-auto" />}>
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
        </IconMenu> */}
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
            label="Vertical cuts"
            options={[
              { value: "width", label: "Width" },
              { value: "length", label: "Length" },
            ]}
            selected={pipe(
              verticalCuts,
              R.filter((x) => x),
              keys
            )}
            onChange={setVerticalCuts}
          />
          <Radio
            id="ground-plane"
            label="Ground Plane"
            options={[
              { value: false, label: "None" },
              { value: true, label: "Regular" },
            ]}
            selected={groundPlane}
            onChange={(newValue) => {
              setGroundPlane(newValue)
            }}
          />
        </IconMenu>
        <IconMenu
          icon={() => <WatsonHealthSubVolume size={24} className="m-auto" />}
        >
          <Checklist
            label="Building elements"
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
        </IconMenu>
      </div>
      <SiteSidebar open={sidebar} close={() => void setSidebar(false)} />
      <UniversalMenu
        open={universalMenu}
        close={() => setUniversalMenu(false)}
      />
      <HeaderStartPortal>
        <Breadcrumbs />
      </HeaderStartPortal>
      {menu.open && <ContextMenuEntry {...{ x: menu.x, y: menu.y }} />}
      <ExitMode />
    </Fragment>
  )
}

export default HtmlUi
