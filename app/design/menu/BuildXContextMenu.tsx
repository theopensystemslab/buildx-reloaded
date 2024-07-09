import {
  ScopeElement,
  SiteCtxMode,
  SiteCtxModeEnum,
} from "@opensystemslab/buildx-core"
import { useState } from "react"
import BuildingModeContextMenuItems from "./building/BuildingModeContextMenuItems"
import ContextMenu from "./common/ContextMenu"
import SiteModeContextMenuItems from "./site/SiteModeContextMenuItems"

type Props = {
  scopeElement: ScopeElement
  x: number
  y: number
  close: () => void
  mode: SiteCtxMode | null
  setMode: (mode: SiteCtxMode) => void
}

const BuildXContextMenu = (props: Props) => {
  const { scopeElement, x, y, close, mode } = props

  const children = (function () {
    switch (mode?.label) {
      case SiteCtxModeEnum.Enum.SITE:
        return <SiteModeContextMenuItems {...{ x, y, scopeElement, close }} />
      case SiteCtxModeEnum.Enum.BUILDING:
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
