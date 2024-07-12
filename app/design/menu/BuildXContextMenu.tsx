import {
  SceneContextMode,
  SceneContextModeLabel,
  ScopeElement,
} from "@opensystemslab/buildx-core"
import BuildingModeContextMenuItems from "./building/BuildingModeContextMenuItems"
import ContextMenu from "./common/ContextMenu"
import SiteModeContextMenuItems from "./site/SiteModeContextMenuItems"

type Props = {
  scopeElement: ScopeElement
  x: number
  y: number
  close: () => void
  mode: SceneContextMode | null
  setMode: (mode: SceneContextMode) => void
}

const BuildXContextMenu = (props: Props) => {
  const { scopeElement, x, y, close, mode } = props

  const children = (function () {
    switch (mode?.label) {
      case SceneContextModeLabel.Enum.SITE:
        return <SiteModeContextMenuItems {...{ x, y, scopeElement, close }} />
      case SceneContextModeLabel.Enum.BUILDING:
        return (
          <BuildingModeContextMenuItems {...{ x, y, scopeElement, close }} />
        )
      // case SiteCtxModeEnum.Enum.ROW:
      //   return <LevelModeContextMenu {...{ x, y, scopeElement }} />
      default:
        return null
    }
  })()

  return (
    <ContextMenu pageX={x} pageY={y} onClose={close}>
      {children}
    </ContextMenu>
  )
}

export default BuildXContextMenu
