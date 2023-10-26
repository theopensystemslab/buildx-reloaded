import { Add, Reset, View, WatsonHealthSubVolume } from "@carbon/icons-react"
import { Fragment, useMemo, useState } from "react"
import IconButton from "~/ui/IconButton"
import IconMenu from "~/ui/IconMenu"
import UniversalMenu from "~/ui/UniversalMenu"
import { Menu, SectionCuts } from "~/ui/icons"
import {
  setGroundPlaneEnabled,
  setSidebar,
  useDesignSettings,
  useVerticalCuts,
} from "../state/settings"
// import Checklist from "./Checklist"
import { keys } from "fp-ts/lib/Record"
import { pipe } from "fp-ts/lib/function"
import usePortal from "react-cool-portal"
import Checklist from "~/ui/Checklist"
import Radio from "~/ui/Radio"
import { R, S } from "~/utils/functions"
import {
  setOrthographic,
  useCameraReset,
  useOrthographic,
} from "../state/camera"
import elementCategories, {
  useElementCategories,
} from "../state/elementCategories"
import { useMenu } from "../state/menu"
import { useScope } from "../state/scope"
import { SiteCtxModeEnum, useSiteCtx } from "../state/siteCtx"
import ExitMode from "./ExitMode"
import ObjectsSidebar from "./ObjectsSidebar"
import BuildingModeContextMenu from "./menu/building/BuildingModeContextMenu"
import LevelModeContextMenu from "./menu/level/LevelModeContextMenu"
import SiteModeContextMenu from "./menu/site/SiteModeContextMenu"
import MetricsWidget from "./metrics/MetricsWidget"
import Breadcrumbs from "./Breadcrumbs"
import { useEvent } from "react-use"
import { useSnapshot } from "valtio"
import { useHtgFoo } from "../ui-3d/fresh/scene/houseTransformsGroup"

type Props = {
  controlsEnabled: boolean
}

const HtmlUi = (props: Props) => {
  const { groundPlaneEnabled: groundPlane } = useDesignSettings()
  const orthographic = useOrthographic()

  // const { mapboxEnabled } = useMapboxStore()

  const [universalMenu, setUniversalMenu] = useState(false)
  const cameraReset = useCameraReset()

  const categories = useElementCategories()

  const [verticalCuts, setVerticalCuts] = useVerticalCuts()
  // useInsert1000Skylarks()

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

  const { mode } = useSiteCtx()
  const { hovered, selected } = useScope()

  const menu = useMenu()

  const ContextMenu = useMemo((): (() => JSX.Element | null) => {
    if (!menu.open || selected === null) return () => null

    const scopeElement = selected

    const { x, y } = menu

    switch (mode) {
      case SiteCtxModeEnum.Enum.SITE:
        return () => <SiteModeContextMenu {...{ x, y, scopeElement }} />
      case SiteCtxModeEnum.Enum.BUILDING:
        return () => <BuildingModeContextMenu {...{ x, y, scopeElement }} />
      default:
        return () => <LevelModeContextMenu {...{ x, y, scopeElement }} />
    }
  }, [menu, selected, mode])

  // {menu.open && selected !== null && <ContextMenuEntry {...{ x: menu.x, y: menu.y }} />}

  // const foo = useHtgFoo()

  return (
    <Fragment>
      <div className="absolute bottom-0 right-0 pointer-events-none">
        {/* <pre>{JSON.stringify(foo, null, 2)}</pre> */}
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
              setGroundPlaneEnabled(newValue)
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

      <MetricsWidget />

      <ObjectsSidebar />

      <UniversalMenu
        open={universalMenu}
        close={() => setUniversalMenu(false)}
      />

      <HeaderStartPortal>
        <Breadcrumbs />
      </HeaderStartPortal>

      <ContextMenu />

      <ExitMode />
    </Fragment>
  )
}

export default HtmlUi
